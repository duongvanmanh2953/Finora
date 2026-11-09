import fs from 'fs';
import path from 'path';
import type { FinanceData, User } from '../../types';
import { seed } from '../../mocks/data';
import { todayKey, uid } from '../../lib/finance';
import { hashPassword, verifyPassword, hashToken, generateSecureToken } from '../auth/security';

export interface DbUser extends User {
  role?: 'user' | 'admin';
  passwordHash?: string;
  isSuspended: boolean;
  createdAt: string;
  lastActive: string;
  mustChangePassword?: boolean;
  lastAdminResetTimestamp?: number;
  emailVerified?: boolean;
}

export interface RefreshTokenSession {
  id: string;
  userId: string;
  tokenHash: string;
  ip: string;
  userAgent: string;
  createdAt: number;
  expiresAt: number; // Max 120 days
  isRevoked: boolean;
  replacedByTokenHash?: string; // For reuse detection
}

export interface SubscriptionPlan {
  id: string;
  code: 'FREE' | 'VIP_GOLD' | 'PRO';
  name: string;
  price: number;
  originalPrice?: number;
  billingPeriod: string;
  billingCycle: 'monthly' | 'annual';
  badge?: string;
  features: string[];
  isActive: boolean;
  tier: 'free' | 'pro' | 'gold';
}

export interface PaymentOrder {
  id: string;
  orderCode: number;
  userId: string;
  userEmail: string;
  planId: string;
  amount: number;
  currency: 'VND';
  status: 'CREATED' | 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED' | 'REFUNDED' | 'REQUIRES_REVIEW';
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  idempotencyKey?: string;
  payosTransactionId?: string;
  reconciledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdempotencyRecord {
  key: string;
  scope: string;
  endpoint: string;
  requestHash: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response?: any;
  createdAt: number;
  expiresAt: number;
}

export interface ThirdPartyCost {
  id: string;
  provider: string;
  category: 'server' | 'domain' | 'email' | 'ai' | 'storage' | 'payment_gateway';
  amount: number;
  currency: 'VND' | 'USD';
  billingCycle: 'monthly' | 'annual' | 'usage_based';
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  invoiceUrl?: string;
  approvedBy?: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  admin: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'BLOCKED';
  ip: string;
  time: string;
  timestamp: number;
}

export interface DatabaseSchema {
  users: Record<string, DbUser>;
  financeData: Record<string, FinanceData>;
  sessions: Record<string, string>; // accessToken -> userId
  refreshTokens: Record<string, RefreshTokenSession>; // tokenHash -> session
  plans: Record<string, SubscriptionPlan>;
  orders: Record<string, PaymentOrder>;
  idempotency: Record<string, IdempotencyRecord>;
  thirdPartyCosts: ThirdPartyCost[];
  auditLogs: AuditLogEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'finora_db.json');
const MAX_SESSION_DAYS = 120;

class TichSanDatabase {
  private schema: DatabaseSchema;
  private initialized = false;

  constructor() {
    this.schema = {
      users: {},
      financeData: {},
      sessions: {},
      refreshTokens: {},
      plans: {},
      orders: {},
      idempotency: {},
      thirdPartyCosts: [],
      auditLogs: []
    };
    this.init();
  }

  private init() {
    if (this.initialized) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const loaded = JSON.parse(raw);
        this.schema = {
          ...this.schema,
          ...loaded,
          refreshTokens: loaded.refreshTokens || {},
          plans: loaded.plans || {},
          orders: loaded.orders || {},
          idempotency: loaded.idempotency || {},
          thirdPartyCosts: loaded.thirdPartyCosts || [],
          auditLogs: loaded.auditLogs || []
        };
      } else {
        this.seedInitialData();
        this.persist();
      }

      // Ensure default plans exist
      if (Object.keys(this.schema.plans).length === 0) {
        this.seedDefaultPlans();
        this.persist();
      }

      // Ensure initial third-party costs exist for monitoring
      if (this.schema.thirdPartyCosts.length === 0) {
        this.seedThirdPartyCosts();
        this.persist();
      }
    } catch {
      this.seedInitialData();
    }
    this.initialized = true;
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('[TichSanDatabase] Error persisting database:', err);
    }
  }

  private seedDefaultPlans() {
    const plans: SubscriptionPlan[] = [
      {
        id: 'plan-free',
        code: 'FREE',
        name: 'Gói Cơ Bản (Free)',
        price: 0,
        billingPeriod: 'Miễn phí vĩnh viễn',
        billingCycle: 'monthly',
        features: [
          'Tối đa 2 tài khoản tiền mặt & ngân hàng',
          'Ghi chép giao dịch không giới hạn',
          '3 danh mục ngân sách chi tiêu',
          '1 mục tiêu tích lũy tài chính',
          'Lưu trữ dữ liệu Local-First bảo mật'
        ],
        isActive: true,
        tier: 'free'
      },
      {
        id: 'plan-trial',
        code: 'VIP_GOLD',
        name: 'Dùng Thử VIP Gold (30 Ngày)',
        price: 0,
        billingPeriod: 'Tặng miễn phí 30 ngày',
        billingCycle: 'monthly',
        badge: 'ƯU ĐÃI CHÀO MỪNG',
        features: [
          'Toàn bộ đặc quyền của Gói Gold VIP',
          'Không giới hạn tài khoản & danh mục',
          'Định giá danh mục đầu tư Realtime',
          'Speedometer Gauges phân tích sức khỏe tài chính',
          'Tự động quay về Free sau 30 ngày (Bảo toàn dữ liệu 100%)'
        ],
        isActive: true,
        tier: 'gold'
      },
      {
        id: 'plan-pro-year',
        code: 'PRO',
        name: 'Tích Sản Pro (Năm)',
        price: 499000,
        originalPrice: 840000,
        billingPeriod: '499.000 ₫/năm (~41k/tháng)',
        billingCycle: 'annual',
        badge: 'TIẾT KIỆM 40%',
        features: [
          'Không giới hạn tài khoản ngân hàng & ví',
          'Tự động ghi nhận giao dịch định kỳ (Auto-recurring)',
          'Đồng bộ giá cổ phiếu HOSE/HNX & Vàng SJC',
          'Xuất báo cáo tài chính Excel & PDF đa kỳ',
          'Hỗ trợ ưu tiên 24/7'
        ],
        isActive: true,
        tier: 'pro'
      },
      {
        id: 'plan-gold-year',
        code: 'VIP_GOLD',
        name: 'Tích Sản VIP Gold (Năm)',
        price: 999000,
        originalPrice: 1800000,
        billingPeriod: '999.000 ₫/năm (~83k/tháng)',
        billingCycle: 'annual',
        badge: 'KHUYÊN DÙNG — TOÀN DIỆN NHẤT',
        features: [
          'Toàn bộ đặc quyền của Gói Pro',
          'Smart Ledger: Phân tách vốn đầu tư chưa thu hồi',
          'Speedometer Gauges 4 cấp độ cảnh báo rủi ro',
          'Tự tính lãi kép danh mục vàng, tiết kiệm & trái phiếu',
          'Trợ lý AI Phân tích dòng tiền không giới hạn',
          'Cố vấn tài chính chuyên biệt'
        ],
        isActive: true,
        tier: 'gold'
      }
    ];

    for (const p of plans) {
      this.schema.plans[p.id] = p;
    }
  }

  private seedThirdPartyCosts() {
    this.schema.thirdPartyCosts = [
      {
        id: 'cost-hetzner',
        provider: 'Hetzner Cloud VPS',
        category: 'server',
        amount: 320000,
        currency: 'VND',
        billingCycle: 'monthly',
        dueDate: '2026-11-20',
        status: 'paid',
        approvedBy: 'Admin',
        createdAt: '2026-11-01',
        paidAt: '2026-11-02',
        notes: 'Máy chủ chạy node runtime & Nginx production'
      },
      {
        id: 'cost-cloudflare',
        provider: 'Cloudflare Registrar & DNS',
        category: 'domain',
        amount: 240000,
        currency: 'VND',
        billingCycle: 'annual',
        dueDate: '2027-05-15',
        status: 'paid',
        approvedBy: 'Admin',
        createdAt: '2026-05-15',
        paidAt: '2026-05-15',
        notes: 'Tên miền tichsan.vn & SSL wildcard'
      },
      {
        id: 'cost-resend',
        provider: 'Resend SMTP Email',
        category: 'email',
        amount: 0,
        currency: 'VND',
        billingCycle: 'monthly',
        dueDate: '2026-11-30',
        status: 'paid',
        approvedBy: 'Admin',
        createdAt: '2026-11-01',
        notes: 'Gói miễn phí 3.000 emails/tháng xác minh tài khoản'
      },
      {
        id: 'cost-gemini-ai',
        provider: 'Google Gemini Pro / Flash API',
        category: 'ai',
        amount: 150000,
        currency: 'VND',
        billingCycle: 'usage_based',
        dueDate: '2026-12-05',
        status: 'pending',
        createdAt: '2026-11-01',
        notes: 'API phân tích dòng tiền & trợ lý AI cá nhân'
      }
    ];
  }

  private seedInitialData() {
    const now = new Date();
    // 1. Initial Demo User
    const demoUser: DbUser = {
      id: 'usr_demo_vip',
      name: 'Nguyễn Minh Anh',
      email: 'minhanh@tichsan.vn',
      role: 'user',
      currency: 'VND',
      financialMonthStart: 1,
      plan: 'gold',
      subscription_status: 'trialing',
      trial_started_at: now.toISOString(),
      trial_ends_at: new Date(now.getTime() + 30 * 86400 * 1000).toISOString(),
      current_plan_id: 'plan-trial',
      streakCount: 7,
      lastCheckInDate: todayKey(),
      defaultAccountId: 'acc_wallet',
      isSuspended: false,
      createdAt: '2026-10-15',
      lastActive: todayKey(),
      nlpUsageToday: { date: todayKey(), count: 0 },
      emailVerified: true
    };

    const regularUser: DbUser = {
      id: 'usr_free_user',
      name: 'Trần Hoàng Long',
      email: 'hoanglong.tran@gmail.com',
      role: 'user',
      currency: 'VND',
      financialMonthStart: 1,
      plan: 'free',
      subscription_status: 'free',
      current_plan_id: 'plan-free',
      streakCount: 2,
      lastCheckInDate: todayKey(),
      defaultAccountId: 'acc_wallet',
      isSuspended: false,
      createdAt: '2026-10-10',
      lastActive: todayKey(),
      nlpUsageToday: { date: todayKey(), count: 0 },
      emailVerified: true
    };

    this.schema.users[demoUser.id] = demoUser;
    this.schema.users[regularUser.id] = regularUser;

    this.schema.financeData[demoUser.id] = {
      ...structuredClone(seed),
      user: demoUser
    };

    this.schema.auditLogs = [
      {
        id: 'aud-891',
        admin: 'system',
        action: 'BOOTSTRAP_DATABASE_INITIALIZED',
        resource: '/system/db',
        status: 'SUCCESS',
        ip: '127.0.0.1',
        time: 'Vừa xong',
        timestamp: Date.now()
      }
    ];

    this.seedDefaultPlans();
    this.seedThirdPartyCosts();
  }

  // --- USER AUTHENTICATION & TRIAL MANAGEMENT ---

  public register(name: string, email: string, password?: string, ip = '127.0.0.1', userAgent = 'Browser'): { user: DbUser; accessToken: string; refreshToken: string } {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = Object.values(this.schema.users).find(u => u.email === trimmedEmail);
    if (existing) {
      throw new Error('Email đã được đăng ký trên hệ thống');
    }

    const now = new Date();
    // 30-Day VIP Gold Trial
    const trialEnds = new Date(now.getTime() + 30 * 86400 * 1000);

    const newUser: DbUser = {
      id: `usr_${uid()}`,
      name: name.trim(),
      email: trimmedEmail,
      role: 'user',
      currency: 'VND',
      financialMonthStart: 1,
      plan: 'gold',
      subscription_status: 'trialing',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      current_plan_id: 'plan-trial',
      streakCount: 1,
      lastCheckInDate: todayKey(),
      defaultAccountId: 'acc_wallet',
      isSuspended: false,
      createdAt: todayKey(),
      lastActive: todayKey(),
      nlpUsageToday: { date: todayKey(), count: 0 },
      emailVerified: false,
      passwordHash: password ? hashPassword(password) : undefined
    };

    this.schema.users[newUser.id] = newUser;

    // Create fresh initial finance data for new user
    const freshData: FinanceData = {
      ...structuredClone(seed),
      user: newUser,
      accounts: [
        {
          id: 'acc_wallet',
          name: 'Ví tiền mặt',
          type: 'cash',
          openingBalance: 2000000,
          color: '#10B981',
          createdAt: todayKey(),
          active: true
        },
        {
          id: 'acc_bank_vcb',
          name: 'Vietcombank Digibank',
          type: 'bank',
          openingBalance: 15000000,
          color: '#059669',
          createdAt: todayKey(),
          active: true
        }
      ],
      transactions: [
        {
          id: `tx_${uid()}`,
          name: 'Số dư đầu kỳ chào mừng Tích Sản',
          amount: 17000000,
          type: 'income',
          categoryId: 'salary',
          accountId: 'acc_bank_vcb',
          date: todayKey(),
          method: 'Chuyển khoản',
          note: 'Khởi tạo tài khoản với 30 ngày trải nghiệm VIP Gold miễn phí',
          status: 'completed'
        }
      ]
    };

    this.schema.financeData[newUser.id] = freshData;

    // Issue tokens: Access token (15 mins) & Refresh token (120 days)
    const { accessToken, refreshToken } = this.createSession(newUser.id, ip, userAgent);

    this.addAuditLog('system', 'USER_REGISTERED_30D_GOLD_TRIAL', `/api/users/${newUser.id}`, 'SUCCESS', ip);
    this.persist();
    return { user: newUser, accessToken, refreshToken };
  }

  public login(email: string, password?: string, ip = '127.0.0.1', userAgent = 'Browser'): { user: DbUser; accessToken: string; refreshToken: string } {
    const trimmedEmail = email.trim().toLowerCase();
    const user = Object.values(this.schema.users).find(u => u.email === trimmedEmail);

    if (!user) {
      // Auto-provision demo account if unseeded
      return this.register(trimmedEmail.split('@')[0] || 'Khách hàng', trimmedEmail, password, ip, userAgent);
    }

    if (user.isSuspended) {
      throw new Error('Tài khoản đã bị tạm khóa do vi phạm chính sách bảo mật');
    }

    if (user.passwordHash && password) {
      const match = verifyPassword(password, user.passwordHash);
      if (!match) {
        this.addAuditLog(user.email, 'LOGIN_FAILED_WRONG_PASSWORD', `/api/auth/login`, 'BLOCKED', ip);
        throw new Error('Mật khẩu không chính xác');
      }
    }

    user.lastActive = todayKey();
    this.checkTrialExpiry(user);

    const { accessToken, refreshToken } = this.createSession(user.id, ip, userAgent);

    this.addAuditLog(user.email, 'USER_LOGIN_SUCCESS', `/api/auth/login`, 'SUCCESS', ip);
    this.persist();
    return { user, accessToken, refreshToken };
  }

  /**
   * 120-Day Session Management with Rotating Refresh Tokens
   */
  public createSession(userId: string, ip: string, userAgent: string): { accessToken: string; refreshToken: string } {
    const accessToken = `atk_${generateSecureToken(24)}_${Date.now()}`;
    const refreshToken = `rtk_${generateSecureToken(32)}_${Date.now()}`;
    const tokenHash = hashToken(refreshToken);

    const now = Date.now();
    const expiresAt = now + MAX_SESSION_DAYS * 86400 * 1000; // 120 days

    this.schema.sessions[accessToken] = userId;
    this.schema.refreshTokens[tokenHash] = {
      id: `ses_${uid()}`,
      userId,
      tokenHash,
      ip,
      userAgent,
      createdAt: now,
      expiresAt,
      isRevoked: false
    };

    return { accessToken, refreshToken };
  }

  /**
   * Refresh Token Rotation with Reuse Detection
   */
  public rotateRefreshToken(oldRefreshToken: string, ip: string, userAgent: string): { accessToken: string; refreshToken: string; user: DbUser } {
    const oldHash = hashToken(oldRefreshToken);
    const session = this.schema.refreshTokens[oldHash];

    if (!session) {
      throw new Error('Refresh token không hợp lệ hoặc không tồn tại');
    }

    // Reuse detection: If token was already replaced, someone might have stolen it!
    if (session.isRevoked || session.replacedByTokenHash) {
      // Revoke all sessions for this user immediately for safety
      this.revokeAllUserSessions(session.userId);
      this.addAuditLog(session.userId, 'SECURITY_ALERT_REFRESH_TOKEN_REUSE_DETECTED', '/api/auth/refresh', 'BLOCKED', ip);
      this.persist();
      throw new Error('Phát hiện token đã qua sử dụng. Toàn bộ phiên đăng nhập đã bị thu hồi vì lý do bảo mật.');
    }

    if (Date.now() > session.expiresAt) {
      session.isRevoked = true;
      this.persist();
      throw new Error('Phiên đăng nhập 120 ngày đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const user = this.schema.users[session.userId];
    if (!user || user.isSuspended) {
      throw new Error('Tài khoản không hợp lệ hoặc đã bị khóa');
    }

    // Issue new pair and rotate
    const newAccessToken = `atk_${generateSecureToken(24)}_${Date.now()}`;
    const newRefreshToken = `rtk_${generateSecureToken(32)}_${Date.now()}`;
    const newHash = hashToken(newRefreshToken);

    const now = Date.now();
    // Maintain original session lifespan or slide safely within 120 days
    const expiresAt = Math.min(session.expiresAt, now + MAX_SESSION_DAYS * 86400 * 1000);

    // Invalidate old token and link to new one
    session.isRevoked = true;
    session.replacedByTokenHash = newHash;

    this.schema.sessions[newAccessToken] = user.id;
    this.schema.refreshTokens[newHash] = {
      id: `ses_${uid()}`,
      userId: user.id,
      tokenHash: newHash,
      ip,
      userAgent,
      createdAt: now,
      expiresAt,
      isRevoked: false
    };

    this.checkTrialExpiry(user);
    this.persist();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
  }

  public getUserByToken(accessToken: string): DbUser | null {
    const userId = this.schema.sessions[accessToken];
    if (!userId) return null;
    const user = this.schema.users[userId];
    if (user) {
      this.checkTrialExpiry(user);
    }
    return user || null;
  }

  public logout(accessToken: string, refreshToken?: string) {
    delete this.schema.sessions[accessToken];
    if (refreshToken) {
      const hash = hashToken(refreshToken);
      const session = this.schema.refreshTokens[hash];
      if (session) {
        session.isRevoked = true;
      }
    }
    this.persist();
  }

  public revokeAllUserSessions(userId: string) {
    // Revoke all access tokens
    for (const [token, uidVal] of Object.entries(this.schema.sessions)) {
      if (uidVal === userId) {
        delete this.schema.sessions[token];
      }
    }
    // Revoke all refresh tokens
    for (const session of Object.values(this.schema.refreshTokens)) {
      if (session.userId === userId) {
        session.isRevoked = true;
      }
    }
    this.persist();
  }

  /**
   * Auto-expire 30-Day VIP Gold trial and revert gracefully to Free without data loss
   */
  public checkTrialExpiry(user: DbUser) {
    if (user.subscription_status === 'trialing' && user.trial_ends_at) {
      const endsAt = new Date(user.trial_ends_at).getTime();
      if (Date.now() > endsAt) {
        user.subscription_status = 'expired';
        user.plan = 'free';
        user.current_plan_id = 'plan-free';

        const userFinance = this.schema.financeData[user.id];
        if (userFinance) {
          userFinance.user.subscription_status = 'expired';
          userFinance.user.plan = 'free';
          userFinance.user.current_plan_id = 'plan-free';
        }

        this.addAuditLog('system', 'TRIAL_AUTO_EXPIRED_REVERT_TO_FREE', `/api/users/${user.id}`, 'SUCCESS');
      }
    }
  }

  // --- FINANCIAL DATA ACCESS ---

  public getFinanceData(userId: string): FinanceData {
    const user = this.schema.users[userId];
    if (!user) {
      throw new Error('User không tồn tại');
    }
    this.checkTrialExpiry(user);

    let data = this.schema.financeData[userId];
    if (!data) {
      data = {
        ...structuredClone(seed),
        user
      };
      this.schema.financeData[userId] = data;
      this.persist();
    } else {
      data.user = user;
    }

    return data;
  }

  public saveFinanceData(userId: string, data: FinanceData): void {
    let user = this.schema.users[userId];
    if (!user) {
      if (userId === 'usr_demo_vip' || userId.startsWith('usr_')) {
        user = {
          id: userId,
          name: data.user?.name || 'Khách hàng Tích Sản',
          email: data.user?.email || `${userId}@finora.vn`,
          role: 'user',
          currency: 'VND',
          financialMonthStart: 1,
          plan: data.user?.plan || 'free',
          subscription_status: data.user?.subscription_status || 'free',
          streakCount: 1,
          lastCheckInDate: todayKey(),
          defaultAccountId: 'wallet',
          isSuspended: false,
          createdAt: todayKey(),
          lastActive: todayKey(),
          emailVerified: false
        };
        this.schema.users[userId] = user;
      } else {
        throw new Error('Unauthorized: User không tồn tại');
      }
    }

    data.user = {
      ...user,
      ...data.user,
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      subscription_status: user.subscription_status
    };

    this.schema.financeData[userId] = data;
    this.persist();
  }

  public processSyncBatch(
    userId: string,
    operations: any[],
    user?: DbUser | null
  ): Array<{ operation_id: string; status: string; error?: string; server_version?: number }> {
    const results: Array<{ operation_id: string; status: string; error?: string; server_version?: number }> = [];
    const currentData = this.getFinanceData(userId);
    let currentVersion = currentData.server_version || 1;

    // Check if user's trial is expired
    const isExpired = user && (
      user.subscription_status === 'expired' ||
      (user.subscription_status === 'trialing' && user.trial_ends_at && new Date(user.trial_ends_at).getTime() < Date.now())
    );

    for (const op of operations) {
      // 1. Idempotency Check
      const idempotencyKey = op.idempotency_key || `op_${op.operation_id}`;
      if (this.schema.idempotency[idempotencyKey]) {
        results.push({
          operation_id: op.operation_id,
          status: 'SYNCED',
          server_version: currentVersion
        });
        continue;
      }

      // 2. VIP Entitlement Protection: If user is expired and op requires VIP entitlement
      if (isExpired && op.payload && op.payload.requires_vip) {
        results.push({
          operation_id: op.operation_id,
          status: 'REQUIRES_PLAN',
          error: 'Thời gian dùng thử VIP Gold đã kết thúc. Tính năng này yêu cầu gia hạn gói VIP.',
          server_version: currentVersion
        });
        continue;
      }

      // 3. Concurrency check
      if (op.local_version && op.local_version < currentVersion - 5) {
        results.push({
          operation_id: op.operation_id,
          status: 'CONFLICT',
          error: 'Phiên bản dữ liệu cũ hơn so với máy chủ',
          server_version: currentVersion
        });
        continue;
      }

      // 4. Apply mutation
      try {
        if (op.entity_type === 'bulk_sync' && op.payload) {
          this.saveFinanceData(userId, op.payload);
        } else if (op.entity_type === 'transaction' && op.payload) {
          if (op.operation_type === 'CREATE') {
            currentData.transactions = currentData.transactions || [];
            currentData.transactions.unshift({ ...op.payload, is_synced: true, sync_status: 'SYNCED' });
          } else if (op.operation_type === 'UPDATE') {
            currentData.transactions = (currentData.transactions || []).map(t =>
              t.id === op.entity_id ? { ...t, ...op.payload, is_synced: true, sync_status: 'SYNCED' } : t
            );
          } else if (op.operation_type === 'DELETE') {
            currentData.transactions = (currentData.transactions || []).filter(t => t.id !== op.entity_id);
          }
          this.saveFinanceData(userId, currentData);
        }

        currentVersion++;
        currentData.server_version = currentVersion;

        // Record idempotency
        this.schema.idempotency[idempotencyKey] = {
          key: idempotencyKey,
          scope: 'sync_batch',
          endpoint: '/api/sync/batch',
          requestHash: idempotencyKey,
          status: 'COMPLETED',
          response: { status: 'SYNCED', operation_id: op.operation_id },
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000
        };

        results.push({
          operation_id: op.operation_id,
          status: 'SYNCED',
          server_version: currentVersion
        });
      } catch (err: any) {
        results.push({
          operation_id: op.operation_id,
          status: 'FAILED',
          error: err.message || 'Lỗi áp dụng thay đổi trên máy chủ'
        });
      }
    }

    this.persist();
    return results;
  }

  public recordConsent(userId: string, consent: any): void {
    const key = `consent_${userId}_${consent?.terms_version || 'default'}`;
    this.schema.idempotency[key] = {
      key,
      scope: 'consent',
      endpoint: '/api/auth/consent',
      requestHash: key,
      status: 'COMPLETED',
      response: consent,
      createdAt: Date.now(),
      expiresAt: Date.now() + 365 * 86400000
    };
    this.persist();
  }

  // --- ADMIN & BOOTSTRAP CLI OPERATIONS ---

  public getOrCreateBootstrapAdmin(adminEmail = 'admin@tichsan.ai'): { admin: DbUser; isNew: boolean } {
    let admin = Object.values(this.schema.users).find(u => u.email === adminEmail);
    if (!admin && (adminEmail === 'admin@tichsan.ai' || adminEmail === 'admin@tichsan.vn')) {
      admin = Object.values(this.schema.users).find(u => u.role === 'admin' || u.email === 'admin@tichsan.vn');
      if (admin) {
        admin.email = adminEmail;
      }
    }
    if (!admin) {
      admin = {
        id: `usr_admin_${uid()}`,
        name: 'Quản trị viên Hệ thống',
        email: adminEmail,
        role: 'admin',
        currency: 'VND',
        financialMonthStart: 1,
        plan: 'gold',
        subscription_status: 'active',
        streakCount: 0,
        lastCheckInDate: todayKey(),
        defaultAccountId: 'acc_wallet',
        isSuspended: false,
        createdAt: todayKey(),
        lastActive: todayKey(),
        emailVerified: true
      };
      this.schema.users[admin.id] = admin;
      this.persist();
      return { admin, isNew: true };
    }
    return { admin, isNew: false };
  }

  public rotateAdminPassword(newPasswordPlain: string, adminEmail = 'admin@tichsan.ai', force = false): { admin: DbUser; cooldownDays: number } {
    const { admin } = this.getOrCreateBootstrapAdmin(adminEmail);

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 86400 * 1000;

    // Check 7-day cooldown unless forced by authenticated master key
    if (!force && admin.lastAdminResetTimestamp && now - admin.lastAdminResetTimestamp < SEVEN_DAYS_MS) {
      const remainingMs = SEVEN_DAYS_MS - (now - admin.lastAdminResetTimestamp);
      const remainingDays = Math.ceil(remainingMs / (86400 * 1000));
      throw new Error(`Chỉ được phép reset mật khẩu Admin tối đa 1 lần mỗi 7 ngày. Bạn cần đợi thêm ${remainingDays} ngày nữa.`);
    }

    admin.passwordHash = hashPassword(newPasswordPlain);
    admin.mustChangePassword = false;
    admin.lastAdminResetTimestamp = now;
    admin.role = 'admin';

    // Revoke all existing sessions for Admin (Forces full logout on all devices)
    this.revokeAllUserSessions(admin.id);

    this.addAuditLog('server_cli', 'ADMIN_PASSWORD_ROTATED_VIA_SERVER_CLI', `/admin/bootstrap`, 'SUCCESS');
    this.persist();

    return { admin, cooldownDays: 7 };
  }

  public getAllUsers(): DbUser[] {
    return Object.values(this.schema.users).map(u => {
      this.checkTrialExpiry(u);
      return u;
    });
  }

  public grantTrial(userId: string, days = 30): DbUser {
    const user = this.schema.users[userId];
    if (!user) throw new Error('User không tồn tại');

    const now = new Date();
    user.plan = 'gold';
    user.subscription_status = 'trialing';
    user.trial_started_at = now.toISOString();
    user.trial_ends_at = new Date(now.getTime() + days * 86400 * 1000).toISOString();
    user.current_plan_id = 'plan-trial';

    const userFinance = this.schema.financeData[userId];
    if (userFinance) {
      userFinance.user = { ...user };
    }

    this.addAuditLog('admin', `ADMIN_GRANT_${days}D_TRIAL`, `/api/users/${userId}`, 'SUCCESS');
    this.persist();
    return user;
  }

  public toggleSuspend(userId: string): DbUser {
    const user = this.schema.users[userId];
    if (!user) throw new Error('User không tồn tại');

    user.isSuspended = !user.isSuspended;
    const action = user.isSuspended ? 'ADMIN_SUSPEND_USER' : 'ADMIN_UNSUSPEND_USER';
    this.addAuditLog('admin', action, `/api/users/${userId}`, 'SUCCESS');
    this.persist();
    return user;
  }

  public getPlans(): SubscriptionPlan[] {
    return Object.values(this.schema.plans);
  }

  public getThirdPartyCosts(): ThirdPartyCost[] {
    return [...this.schema.thirdPartyCosts];
  }

  public addThirdPartyCost(cost: Omit<ThirdPartyCost, 'id' | 'createdAt'>): ThirdPartyCost {
    const newCost: ThirdPartyCost = {
      ...cost,
      id: `cost_${uid()}`,
      createdAt: todayKey()
    };
    this.schema.thirdPartyCosts.push(newCost);
    this.persist();
    return newCost;
  }

  // --- ORDERS & PAYOS TRANSACTIONS ---

  public createOrder(userId: string, planId: string, amount: number, userEmail: string, idempotencyKey?: string): PaymentOrder {
    const orderCode = Math.floor(100000 + Math.random() * 900000);
    const order: PaymentOrder = {
      id: `ord_${uid()}`,
      orderCode,
      userId,
      userEmail,
      planId,
      amount,
      currency: 'VND',
      status: 'CREATED',
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.schema.orders[order.id] = order;
    this.persist();
    return order;
  }

  public getOrder(orderId: string): PaymentOrder | null {
    return this.schema.orders[orderId] || null;
  }

  public getOrderByCode(orderCode: number): PaymentOrder | null {
    return Object.values(this.schema.orders).find(o => o.orderCode === orderCode) || null;
  }

  public updateOrderStatus(orderId: string, status: PaymentOrder['status'], notes?: string): PaymentOrder {
    const order = this.schema.orders[orderId];
    if (!order) throw new Error('Order không tồn tại');
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (notes) order.notes = notes;

    // If marked PAID, grant subscription entitlements cleanly
    if (status === 'PAID') {
      const user = this.schema.users[order.userId];
      if (user) {
        user.plan = order.planId.includes('gold') ? 'gold' : 'pro';
        user.subscription_status = 'active';
        user.current_plan_id = order.planId;
        const now = new Date();
        user.trial_started_at = undefined;
        user.trial_ends_at = undefined;
        (user as any).proExpiresAt = new Date(now.getTime() + 365 * 86400 * 1000).toISOString();

        const userFinance = this.schema.financeData[order.userId];
        if (userFinance) {
          userFinance.user = { ...user };
        }
      }
    }

    this.persist();
    return order;
  }

  // --- IDEMPOTENCY ---

  public checkIdempotency(key: string, scope: string): IdempotencyRecord | null {
    const record = this.schema.idempotency[`${scope}:${key}`];
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      delete this.schema.idempotency[`${scope}:${key}`];
      this.persist();
      return null;
    }
    return record;
  }

  public saveIdempotency(key: string, scope: string, endpoint: string, requestHash: string, status: IdempotencyRecord['status'], response?: any) {
    this.schema.idempotency[`${scope}:${key}`] = {
      key,
      scope,
      endpoint,
      requestHash,
      status,
      response,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 3600 * 1000 // 24 hours
    };
    this.persist();
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.schema.auditLogs].sort((a, b) => b.timestamp - a.timestamp);
  }

  public addAuditLog(admin: string, action: string, resource: string, status: 'SUCCESS' | 'BLOCKED', ip = '127.0.0.1') {
    const entry: AuditLogEntry = {
      id: `aud-${Math.floor(100 + Math.random() * 900)}`,
      admin,
      action,
      resource,
      status,
      ip,
      time: 'Vừa xong',
      timestamp: Date.now()
    };
    this.schema.auditLogs.unshift(entry);
    if (this.schema.auditLogs.length > 200) {
      this.schema.auditLogs.pop();
    }
    this.persist();
  }
}

export const db = new TichSanDatabase();
