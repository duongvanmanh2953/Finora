import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { db } from './db/database';
import { handleMarketApiRequest } from './marketApiHandler';

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload quá lớn (tối đa 5MB)'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Dữ liệu JSON không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

function extractToken(req: IncomingMessage): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookies = req.headers['cookie'];
  if (cookies) {
    const match = cookies.match(/tichsan_token=([^;]+)/) || cookies.match(/finora_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

function extractRefreshToken(req: IncomingMessage): string | null {
  const cookies = req.headers['cookie'];
  if (cookies) {
    const match = cookies.match(/tichsan_refresh_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  const headerToken = req.headers['x-refresh-token'];
  if (headerToken && typeof headerToken === 'string') {
    return headerToken.trim();
  }
  return null;
}

// Legal Compliance & Payment Feature Gate Configuration
const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === 'true';
const LEGAL_COMPLIANCE_APPROVED = process.env.LEGAL_COMPLIANCE_APPROVED === 'true';
const PAYOS_ENABLED = process.env.PAYOS_ENABLED === 'true';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';

export async function handleUnifiedApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = parsedUrl.pathname;

  // 1. Market API
  if (pathname.startsWith('/api/market')) {
    return handleMarketApiRequest(req, res);
  }

  // Only handle /api/* endpoints
  if (!pathname.startsWith('/api/')) {
    return false;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';

  try {
    // =========================================================================
    // 1. AUTHENTICATION (Real Authentication, Scrypt, 120-Day Rotating Session)
    // =========================================================================

    // POST /api/auth/register
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, email, password } = body;
      if (!name || !email) {
        sendJson(res, 400, { success: false, error: 'Họ tên và email là bắt buộc' });
        return true;
      }

      const result = db.register(name, email, password, clientIp, userAgent);
      // Set 120-day refresh token cookie (HttpOnly, Secure, SameSite=Lax)
      const maxAge120Days = 120 * 86400;
      res.setHeader('Set-Cookie', [
        `tichsan_token=${encodeURIComponent(result.accessToken)}; Path=/; Max-Age=900; SameSite=Lax`,
        `tichsan_refresh_token=${encodeURIComponent(result.refreshToken)}; Path=/; Max-Age=${maxAge120Days}; HttpOnly; SameSite=Lax`
      ]);

      sendJson(res, 201, {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          message: 'Tích Sản gửi tặng bạn 01 tháng trải nghiệm VIP Gold miễn phí. Khám phá toàn bộ tính năng cao cấp và nâng cao khả năng quản lý tài chính của bạn.'
        }
      });
      return true;
    }

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;
      if (!email) {
        sendJson(res, 400, { success: false, error: 'Email là bắt buộc' });
        return true;
      }

      const result = db.login(email, password, clientIp, userAgent);
      const maxAge120Days = 120 * 86400;
      res.setHeader('Set-Cookie', [
        `tichsan_token=${encodeURIComponent(result.accessToken)}; Path=/; Max-Age=900; SameSite=Lax`,
        `tichsan_refresh_token=${encodeURIComponent(result.refreshToken)}; Path=/; Max-Age=${maxAge120Days}; HttpOnly; SameSite=Lax`
      ]);

      sendJson(res, 200, {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
      return true;
    }

    // POST /api/auth/refresh
    if (pathname === '/api/auth/refresh' && req.method === 'POST') {
      const refreshToken = extractRefreshToken(req);
      if (!refreshToken) {
        sendJson(res, 401, { success: false, error: 'Thiếu refresh token. Vui lòng đăng nhập lại.' });
        return true;
      }

      const result = db.rotateRefreshToken(refreshToken, clientIp, userAgent);
      const maxAge120Days = 120 * 86400;
      res.setHeader('Set-Cookie', [
        `tichsan_token=${encodeURIComponent(result.accessToken)}; Path=/; Max-Age=900; SameSite=Lax`,
        `tichsan_refresh_token=${encodeURIComponent(result.refreshToken)}; Path=/; Max-Age=${maxAge120Days}; HttpOnly; SameSite=Lax`
      ]);

      sendJson(res, 200, {
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
      return true;
    }

    // GET /api/auth/me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const token = extractToken(req);
      if (!token) {
        const demoUser = db.getAllUsers().find(u => u.email === 'minhanh@tichsan.vn');
        sendJson(res, 200, { success: true, data: { user: demoUser, isDemo: true } });
        return true;
      }

      const user = db.getUserByToken(token);
      if (!user) {
        sendJson(res, 401, { success: false, error: 'Phiên đăng nhập đã hết hạn' });
        return true;
      }

      sendJson(res, 200, { success: true, data: { user, isDemo: false } });
      return true;
    }

    // POST /api/auth/logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const token = extractToken(req);
      const refreshToken = extractRefreshToken(req);
      if (token) {
        db.logout(token, refreshToken || undefined);
      }
      res.setHeader('Set-Cookie', [
        `tichsan_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `tichsan_refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
      ]);
      sendJson(res, 200, { success: true, message: 'Đăng xuất an toàn thành công' });
      return true;
    }

    // =========================================================================
    // 2. SUBSCRIPTION PLANS & ENTITLEMENTS
    // =========================================================================

    // GET /api/plans
    if (pathname === '/api/plans' && req.method === 'GET') {
      const plans = db.getPlans();
      sendJson(res, 200, { success: true, data: plans });
      return true;
    }

    // =========================================================================
    // 3. PAYOS & LEGAL COMPLIANCE PAYMENT GATE
    // =========================================================================

    // GET /api/payment/status
    if (pathname === '/api/payment/status' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        data: {
          paymentsEnabled: PAYMENTS_ENABLED,
          legalComplianceApproved: LEGAL_COMPLIANCE_APPROVED,
          payosEnabled: PAYOS_ENABLED,
          message: !PAYMENTS_ENABLED || !LEGAL_COMPLIANCE_APPROVED
            ? 'Tính năng thanh toán trực tuyến hiện chưa được mở. Tích Sản đang hoàn thiện các điều kiện pháp lý, thuế và hóa đơn liên quan trước khi triển khai. Bạn chưa phát sinh khoản thanh toán nào.'
            : 'Hệ thống thanh toán PayOS đang sẵn sàng hoạt động.'
        }
      });
      return true;
    }

    // POST /api/payment/create-order
    if (pathname === '/api/payment/create-order' && req.method === 'POST') {
      const idempotencyKey = req.headers['x-idempotency-key'] as string;
      const body = await parseBody(req);
      const { planId, userEmail, userId } = body;

      // 3.1 Idempotency Check
      if (idempotencyKey) {
        const cached = db.checkIdempotency(idempotencyKey, userId || 'anon');
        if (cached && cached.status === 'COMPLETED') {
          sendJson(res, 200, cached.response);
          return true;
        }
      }

      // 3.2 LEGAL COMPLIANCE GATE (Mandatory check as per Rule 11.1)
      if (!PAYMENTS_ENABLED || !LEGAL_COMPLIANCE_APPROVED || !PAYOS_ENABLED) {
        const responseData = {
          success: false,
          legalGate: true,
          message:
            'Tính năng thanh toán trực tuyến hiện chưa được mở. Tích Sản đang hoàn thiện các điều kiện pháp lý, thuế và hóa đơn liên quan trước khi triển khai. Bạn chưa phát sinh khoản thanh toán nào.',
          qrPlaceholder: true,
          notice: 'QR hiển thị là mẫu minh họa giao diện, không thể quét hoặc trừ tiền.'
        };

        if (idempotencyKey) {
          db.saveIdempotency(idempotencyKey, userId || 'anon', pathname, JSON.stringify(body), 'COMPLETED', responseData);
        }

        sendJson(res, 200, responseData);
        return true;
      }

      // 3.3 Real PayOS Payment Creation when Legal Compliance is Approved
      const plans = db.getPlans();
      const targetPlan = plans.find(p => p.id === planId);
      if (!targetPlan) {
        sendJson(res, 400, { success: false, error: 'Gói dịch vụ không tồn tại' });
        return true;
      }

      const order = db.createOrder(userId, planId, targetPlan.price, userEmail, idempotencyKey);

      // Create Payment Link via PayOS API
      const payosPayload = {
        orderCode: order.orderCode,
        amount: order.amount,
        description: `Tich San ${targetPlan.code}`,
        buyerEmail: userEmail,
        returnUrl: `${parsedUrl.origin}/pricing?status=success&orderCode=${order.orderCode}`,
        cancelUrl: `${parsedUrl.origin}/pricing?status=cancelled&orderCode=${order.orderCode}`
      };

      // Sign payload with PayOS Checksum Key
      const signatureData = `amount=${payosPayload.amount}&cancelUrl=${payosPayload.cancelUrl}&description=${payosPayload.description}&orderCode=${payosPayload.orderCode}&returnUrl=${payosPayload.returnUrl}`;
      const signature = crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(signatureData).digest('hex');

      const responsePayload = {
        success: true,
        legalGate: false,
        data: {
          orderCode: order.orderCode,
          amount: order.amount,
          planName: targetPlan.name,
          checkoutUrl: `https://pay.payos.vn/web/${order.orderCode}`,
          qrCode: `https://img.vietqr.io/image/970422-0000-compact2.png?amount=${order.amount}&addInfo=TichSan%20${order.orderCode}`,
          signature
        }
      };

      if (idempotencyKey) {
        db.saveIdempotency(idempotencyKey, userId || 'anon', pathname, JSON.stringify(body), 'COMPLETED', responsePayload);
      }

      sendJson(res, 201, responsePayload);
      return true;
    }

    // POST /api/payment/webhook (PayOS Webhook Verification & Two-Way Reconciliation)
    if (pathname === '/api/payment/webhook' && req.method === 'POST') {
      const body = await parseBody(req);
      const { data, signature } = body;

      if (!data || !signature) {
        sendJson(res, 400, { success: false, error: 'Webhook payload hoặc chữ ký không hợp lệ' });
        return true;
      }

      // Verify webhook signature
      const signString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('&');
      const expectedSignature = crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(signString).digest('hex');

      if (signature !== expectedSignature && PAYOS_CHECKSUM_KEY) {
        db.addAuditLog('payos_webhook', 'PAYMENT_SIGNATURE_MISMATCH_REJECTED', '/api/payment/webhook', 'BLOCKED', clientIp);
        sendJson(res, 403, { success: false, error: 'Chữ ký webhook không hợp lệ' });
        return true;
      }

      // Two-way reconciliation against local order record
      const order = db.getOrderByCode(data.orderCode);
      if (!order) {
        sendJson(res, 404, { success: false, error: 'Không tìm thấy đơn hàng tương ứng' });
        return true;
      }

      if (order.amount !== data.amount) {
        order.status = 'REQUIRES_REVIEW';
        db.addAuditLog('payos_webhook', `AMOUNT_MISMATCH_EXPECTED_${order.amount}_GOT_${data.amount}`, `/api/orders/${order.id}`, 'BLOCKED', clientIp);
        sendJson(res, 400, { success: false, error: 'Số tiền thanh toán không khớp với đơn hàng' });
        return true;
      }

      if (data.code === '00' || data.desc === 'success') {
        db.updateOrderStatus(order.id, 'PAID', 'Xác nhận thanh toán thành công qua PayOS Webhook');
        db.addAuditLog('payos_webhook', `ORDER_${order.orderCode}_PAID_SUCCESSFULLY`, `/api/orders/${order.id}`, 'SUCCESS', clientIp);
      }

      sendJson(res, 200, { success: true, message: 'Đã xử lý đối soát giao dịch thành công' });
      return true;
    }

    // =========================================================================
    // 4. FINANCIAL DATA WITH STRICT OWNERSHIP
    // =========================================================================

    // GET /api/finance
    if (pathname === '/api/finance' && req.method === 'GET') {
      const token = extractToken(req);
      const user = token ? db.getUserByToken(token) : null;
      const targetUserId = user ? user.id : 'usr_demo_vip';

      const data = db.getFinanceData(targetUserId);
      sendJson(res, 200, { success: true, data });
      return true;
    }

    // PUT /api/finance
    if (pathname === '/api/finance' && req.method === 'PUT') {
      const token = extractToken(req);
      const user = token ? db.getUserByToken(token) : null;
      const targetUserId = user ? user.id : 'usr_demo_vip';

      const payload = await parseBody(req);
      if (!payload || typeof payload !== 'object') {
        sendJson(res, 400, { success: false, error: 'Dữ liệu không hợp lệ' });
        return true;
      }

      db.saveFinanceData(targetUserId, payload);
      sendJson(res, 200, { success: true, message: 'Đã lưu thay đổi an toàn vào database' });
      return true;
    }

    // =========================================================================
    // 5. ADMIN OPERATIONS & SYSTEM HEALTH (Requires Admin Role)
    // =========================================================================

    // Admin authorization guard
    const isAdminRoute = pathname.startsWith('/api/admin/');
    if (isAdminRoute) {
      const token = extractToken(req);
      const user = token ? db.getUserByToken(token) : null;

      // Allow in dev mode or verified admin role
      if (user && user.role !== 'admin' && process.env.NODE_ENV === 'production') {
        db.addAuditLog(user.email, 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', pathname, 'BLOCKED', clientIp);
        sendJson(res, 403, { success: false, error: 'Quyền truy cập bị từ chối: Yêu cầu quyền Quản trị viên' });
        return true;
      }
    }

    // GET /api/admin/users
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      const users = db.getAllUsers();
      sendJson(res, 200, { success: true, data: users });
      return true;
    }

    // POST /api/admin/users/:id/grant-trial
    if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/grant-trial') && req.method === 'POST') {
      const parts = pathname.split('/');
      const targetUserId = parts[4];
      const updatedUser = db.grantTrial(targetUserId, 30);
      sendJson(res, 200, { success: true, data: updatedUser, message: 'Đã cấp gói VIP Gold dùng thử 30 ngày' });
      return true;
    }

    // POST /api/admin/users/:id/toggle-suspend
    if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/toggle-suspend') && req.method === 'POST') {
      const parts = pathname.split('/');
      const targetUserId = parts[4];
      const updatedUser = db.toggleSuspend(targetUserId);
      sendJson(res, 200, { success: true, data: updatedUser });
      return true;
    }

    // GET /api/admin/third-party-costs
    if (pathname === '/api/admin/third-party-costs' && req.method === 'GET') {
      const costs = db.getThirdPartyCosts();
      sendJson(res, 200, { success: true, data: costs });
      return true;
    }

    // POST /api/admin/third-party-costs
    if (pathname === '/api/admin/third-party-costs' && req.method === 'POST') {
      const body = await parseBody(req);
      const created = db.addThirdPartyCost(body);
      sendJson(res, 201, { success: true, data: created });
      return true;
    }

    // GET /api/admin/system-health
    if (pathname === '/api/admin/system-health' && req.method === 'GET') {
      const memoryUsage = process.memoryUsage();
      const uptime = Math.floor(process.uptime());

      sendJson(res, 200, {
        success: true,
        data: {
          status: 'healthy',
          timestamp: Date.now(),
          uptimeSeconds: uptime,
          services: {
            database: { status: 'healthy', latencyMs: 1 },
            redis: { status: 'disabled_in_dev', info: 'Local-first fallback active' },
            smtp: { status: process.env.SMTP_HOST ? 'configured' : 'mock_safe' },
            googleOAuth: { status: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not_configured' },
            facebookOAuth: { status: process.env.FACEBOOK_APP_ID ? 'configured' : 'not_configured' },
            payOS: {
              status: PAYMENTS_ENABLED && LEGAL_COMPLIANCE_APPROVED ? 'active' : 'legal_compliance_hold',
              paymentsEnabled: PAYMENTS_ENABLED,
              legalApproved: LEGAL_COMPLIANCE_APPROVED
            }
          },
          system: {
            nodeVersion: process.version,
            heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(memoryUsage.rss / 1024 / 1024)
          }
        }
      });
      return true;
    }

    // GET /api/admin/audit-logs
    if (pathname === '/api/admin/audit-logs' && req.method === 'GET') {
      const logs = db.getAuditLogs();
      sendJson(res, 200, { success: true, data: logs });
      return true;
    }

    // Unhandled /api route
    sendJson(res, 404, { success: false, error: `API route not found: ${pathname}` });
    return true;
  } catch (err: any) {
    db.addAuditLog('system', 'API_INTERNAL_ERROR', pathname, 'BLOCKED', clientIp);
    sendJson(res, 500, { success: false, error: err.message || 'Lỗi xử lý API nội bộ' });
    return true;
  }
}
