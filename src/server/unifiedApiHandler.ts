import type { IncomingMessage, ServerResponse } from 'http';
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
        // 5MB limit
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format in request body'));
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
    const match = cookies.match(/finora_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export async function handleUnifiedApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = parsedUrl.pathname;

  // 1. Check Market API first
  if (pathname.startsWith('/api/market')) {
    return handleMarketApiRequest(req, res);
  }

  // Only handle other /api/* endpoints
  if (!pathname.startsWith('/api/')) {
    return false;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  try {
    // --- AUTHENTICATION ROUTES ---

    // POST /api/auth/register
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, email, password } = body;
      if (!name || !email) {
        sendJson(res, 400, { success: false, error: 'Tên và email là bắt buộc' });
        return true;
      }

      const result = db.register(name, email, password);
      res.setHeader('Set-Cookie', `finora_token=${encodeURIComponent(result.token)}; Path=/; HttpOnly; SameSite=Lax`);
      sendJson(res, 201, {
        success: true,
        data: {
          user: result.user,
          token: result.token,
          message: 'Đăng ký thành công! Đã kích hoạt 30 ngày VIP Gold Trial.'
        }
      });
      return true;
    }

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email } = body;
      if (!email) {
        sendJson(res, 400, { success: false, error: 'Email là bắt buộc' });
        return true;
      }

      const result = db.login(email);
      res.setHeader('Set-Cookie', `finora_token=${encodeURIComponent(result.token)}; Path=/; HttpOnly; SameSite=Lax`);
      sendJson(res, 200, {
        success: true,
        data: {
          user: result.user,
          token: result.token
        }
      });
      return true;
    }

    // GET /api/auth/me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const token = extractToken(req);
      if (!token) {
        // Return default demo user if unauthenticated
        const demoUser = db.getAllUsers().find(u => u.email === 'minhanh@finora.vn');
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
      if (token) {
        db.logout(token);
      }
      res.setHeader('Set-Cookie', `finora_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
      sendJson(res, 200, { success: true, message: 'Đăng xuất thành công' });
      return true;
    }

    // --- FINANCIAL DATA ROUTES WITH STRICT OWNERSHIP ---

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

    // --- ADMIN OPERATIONS ROUTES ---

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
