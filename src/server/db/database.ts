import fs from 'fs';
import path from 'path';
import type { FinanceData, User } from '../../types';
import { seed } from '../../mocks/data';
import { todayKey, uid } from '../../lib/finance';

export interface DbUser extends User {
  passwordHash?: string;
  isSuspended: boolean;
  createdAt: string;
  lastActive: string;
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
  sessions: Record<string, string>; // token -> userId
  auditLogs: AuditLogEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'finora_db.json');

class FinoraDatabase {
  private schema: DatabaseSchema;
  private initialized = false;

  constructor() {
    this.schema = {
      users: {},
      financeData: {},
      sessions: {},
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
        this.schema = JSON.parse(raw);
      } else {
        this.seedInitialData();
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
      console.error('[FinoraDatabase] Error persisting database:', err);
    }
  }

  private seedInitialData() {
    // 1. Initial Admin & Demo Users
    const now = new Date();
    const demoUser: DbUser = {
      id: 'usr_demo_vip',
      name: 'Nguyễn Minh Anh',
      email: 'minhanh@finora.vn',
      currency: 'VND',
      financialMonthStart: 1,
      plan: 'gold',
      subscription_status: 'trialing',
      trial_started_at: now.toISOString(),
      trial_ends_at: new Date(now.getTime() + 30 * 86400 * 1000).toISOString(),
      current_plan_id: 'plan-trial',
      streakCount: 7,
      lastCheckInDate: todayKey(),
      defaultAccountId: 'wallet',
      isSuspended: false,
      createdAt: '2026-10-15',
      lastActive: todayKey(),
      nlpUsageToday: { date: todayKey(), count: 0 }
    };

    const regularUser: DbUser = {
      id: 'usr_free_user',
      name: 'Trần Hoàng Long',
      email: 'hoanglong.tran@gmail.com',
      currency: 'VND',
      financialMonthStart: 1,
      plan: 'free',
      subscription_status: 'free',
      current_plan_id: 'plan-free',
      streakCount: 2,
      lastCheckInDate: todayKey(),
      defaultAccountId: 'wallet',
      isSuspended: false,
      createdAt: '2026-10-10',
      lastActive: todayKey(),
      nlpUsageToday: { date: todayKey(), count: 0 }
    };

    this.schema.users[demoUser.id] = demoUser;
    this.schema.users[regularUser.id] = regularUser;

    // 2. Demo User Finance Data
    this.schema.financeData[demoUser.id] = {
      ...structuredClone(seed),
      user: demoUser
    };

    // 3. Initial Audit Logs
    this.schema.auditLogs = [
      {
        id: 'aud-891',
        admin: 'superadmin@finora.vn',
        action: 'VIEW_SAAS_MRR_ANALYTICS',
        resource: '/api/admin/metrics',
        status: 'SUCCESS',
        ip: '113.161.42.18',
        time: '10 phút trước',
        timestamp: Date.now() - 600000
      },
      {
        id: 'aud-892',
        admin: 'finance@finora.vn',
        action: 'EXPORT_MISA_INVOICES_VAT',
        resource: '/api/admin/invoices/export',
        status: 'SUCCESS',
        ip: '14.162.88.9',
        time: '1 giờ trước',
        timestamp: Date.now() - 3600000
      },
      {
        id: 'aud-893',
        admin: 'support@finora.vn',
        action: 'SUSPEND_BOT_USER',
        resource: '/api/admin/users/usr-5',
        status: 'SUCCESS',
        ip: '118.69.12.55',
        time: '2 giờ trước',
        timestamp: Date.now() - 7200000
      },
      {
        id: 'aud-894',
        admin: 'unknown_probe@proxy.net',
        action: 'UNAUTHORIZED_QUERY_USER_TRANSACTIONS',
        resource: '/api/users/usr-1/transactions',
        status: 'BLOCKED',
        ip: '45.133.1.20',
        time: '5 giờ trước',
        timestamp: Date.now() - 18000000
      }
    ];
  }

  // --- USER AUTHENTICATION & TRIAL MANAGEMENT ---

  public register(name: string, email: string, passwordHash?: string): { user: DbUser; token: string } {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = Object.values(this.schema.users).find(u => u.email === trimmedEmail);
    if (existing) {
      throw new Error('Email đã được đăng ký trên hệ thống');
    }

    const now = new Date();
    // Phase 6 & Phase 10: Auto-grant 30-Day VIP Gold Trial
    const trialEnds = new Date(now.getTime() + 30 * 86400 * 1000);

    const newUser: DbUser = {
      id: `usr_${uid()}`,
      name: name.trim(),
      email: trimmedEmail,
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
      passwordHash
    };

    this.schema.users[newUser.id] = newUser;

    // Create fresh initial finance data for new user (Clean initial state, not polluted by other users)
    const freshData: FinanceData = {
      ...structuredClone(seed),
      user: newUser,
      // Fresh clean initial accounts
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
      // Fresh initial transactions
      transactions: [
        {
          id: `tx_${uid()}`,
          name: 'Số dư đầu kỳ chào mừng Finora',
          amount: 17000000,
          type: 'income',
          categoryId: 'salary',
          accountId: 'acc_bank_vcb',
          date: todayKey(),
          method: 'Chuyển khoản',
          note: 'Khởi tạo tài khoản với 30 ngày trải nghiệm VIP Gold',
          status: 'completed'
        }
      ]
    };

    this.schema.financeData[newUser.id] = freshData;

    // Issue session token
    const token = `tok_${uid()}_${Date.now()}`;
    this.schema.sessions[token] = newUser.id;

    // Log audit event
    this.addAuditLog('system', 'USER_REGISTERED_30D_GOLD_TRIAL', `/api/users/${newUser.id}`, 'SUCCESS');

    this.persist();
    return { user: newUser, token };
  }

  public login(email: string): { user: DbUser; token: string } {
    const trimmedEmail = email.trim().toLowerCase();
    let user = Object.values(this.schema.users).find(u => u.email === trimmedEmail);

    if (!user) {
      // Auto-provision demo account for friction-free authentication
      return this.register(trimmedEmail.split('@')[0] || 'Khách hàng', trimmedEmail);
    }

    if (user.isSuspended) {
      throw new Error('Tài khoản đã bị tạm khóa do vi phạm chính sách bảo mật');
    }

    user.lastActive = todayKey();
    this.checkTrialExpiry(user);

    const token = `tok_${uid()}_${Date.now()}`;
    this.schema.sessions[token] = user.id;

    this.addAuditLog(user.email, 'USER_LOGIN_SUCCESS', `/api/auth/login`, 'SUCCESS');
    this.persist();
    return { user, token };
  }

  public getUserByToken(token: string): DbUser | null {
    const userId = this.schema.sessions[token];
    if (!userId) return null;
    const user = this.schema.users[userId];
    if (user) {
      this.checkTrialExpiry(user);
    }
    return user || null;
  }

  public logout(token: string) {
    delete this.schema.sessions[token];
    this.persist();
  }

  /**
   * Phase 6 Rule: Check trial expiration and gracefully transition to Free
   */
  private checkTrialExpiry(user: DbUser) {
    if (user.subscription_status === 'trialing' && user.trial_ends_at) {
      const endsAt = new Date(user.trial_ends_at).getTime();
      if (Date.now() > endsAt) {
        user.subscription_status = 'expired';
        user.plan = 'free';
        user.current_plan_id = 'plan-free';

        // Keep finance data in sync
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

  // --- STRICT OWNERSHIP & FINANCE DATA ACCESS ---

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
    const user = this.schema.users[userId];
    if (!user) {
      throw new Error('Unauthorized: User không tồn tại');
    }

    // Ownership Enforcement: Never allow overwriting another user's metadata
    data.user = {
      ...user,
      ...data.user,
      id: user.id, // Immutable owner ID
      email: user.email,
      plan: user.plan, // Server-controlled plan
      subscription_status: user.subscription_status
    };

    this.schema.financeData[userId] = data;
    this.persist();
  }

  // --- ADMIN OPERATIONS ---

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
    if (this.schema.auditLogs.length > 100) {
      this.schema.auditLogs.pop();
    }
    this.persist();
  }
}

export const db = new FinoraDatabase();
