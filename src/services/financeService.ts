import type { FinanceData, User } from '../types';
import { seed } from '../mocks/data';
import { todayKey, uid } from '../lib/finance';
import { offlineStorage } from '../lib/offline/indexedDbAdapter';
import { outboxManager } from '../lib/offline/outboxManager';
import { createSignedLease, validateOfflineLease } from '../lib/offline/signedLease';
import { networkManager } from '../lib/offline/networkStatus';
import {
  setCrossSubdomainUserSession,
  getCrossSubdomainUserSession,
  clearCrossSubdomainUserSession
} from '../lib/domainRouting';

const AUTH_USER_KEY = 'finora:auth-user';
const AUTH_TOKEN_KEY = 'finora:auth-token';
const FRESH_INSTALL_KEY = 'finora:app_initialized_v2';
export const COOKIE_CONSENT_KEY = 'finora:cookies_terms_accepted_v1';

const PRESERVED_DEVICE_KEYS = new Set([
  FRESH_INSTALL_KEY,
  COOKIE_CONSENT_KEY,
  'finora:theme',
  'finora:splash_shown'
]);

export async function clearAllLocalUserData(): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          !PRESERVED_DEVICE_KEYS.has(key) &&
          (key.startsWith('finora:') ||
            key.startsWith('tichsan:') ||
            key.startsWith('tichsan_') ||
            key === AUTH_USER_KEY ||
            key === AUTH_TOKEN_KEY)
        ) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
      // Keep fresh install marker so app doesn't re-trigger destructive wipe on next launch
      localStorage.setItem(FRESH_INSTALL_KEY, 'true');
    }
  } catch (err) {
    console.warn('[FinanceService] Error clearing localStorage:', err);
  }

  try {
    clearCrossSubdomainUserSession();
  } catch {}

  try {
    await offlineStorage.clearAllStores();
  } catch (err) {
    console.warn('[FinanceService] Error clearing offlineStorage:', err);
  }
}

export async function checkAndHandleFreshInstall(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    // If incoming navigation carries cross-subdomain credentials or existing session, do NOT wipe
    const search = window.location.search;
    if (
      search.includes('session=') ||
      search.includes('token=') ||
      localStorage.getItem(AUTH_USER_KEY) ||
      getCrossSubdomainUserSession().user
    ) {
      localStorage.setItem(FRESH_INSTALL_KEY, 'true');
      return;
    }

    const isInitialized = localStorage.getItem(FRESH_INSTALL_KEY);
    if (!isInitialized) {
      // First time loading newly installed / downloaded app -> ensure 100% clean state
      await clearAllLocalUserData();
      localStorage.setItem(FRESH_INSTALL_KEY, 'true');
    }
  } catch {}
}

export async function checkEmailAvailability(email: string): Promise<{ exists: boolean; message?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { exists: false };
  try {
    const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const json = await res.json();
      return { exists: !!json.exists, message: json.message };
    }
  } catch {}
  return { exists: false };
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {}
}

export function getActiveStorageKey(): string {
  try {
    const rawUser = localStorage.getItem(AUTH_USER_KEY);
    if (rawUser) {
      const parsed = JSON.parse(rawUser) as User;
      if (parsed?.id) {
        return `finora:user:${parsed.id}:v1`;
      }
    }
  } catch {
    // fallback
  }
  return 'finora:local:guest:v1';
}

export function getCleanEmptyFinanceData(user: User): FinanceData {
  return {
    user,
    accounts: [
      {
        id: 'wallet',
        name: 'Ví tiền mặt',
        type: 'cash',
        openingBalance: 0,
        color: '#10B981',
        createdAt: todayKey(),
        active: true
      }
    ],
    transactions: [],
    categories: structuredClone(seed.categories),
    budgets: [],
    goals: [],
    debts: [],
    investments: [],
    smartInvestmentNotes: [],
    recurring: [],
    notifications: [
      {
        id: 'noti-welcome',
        title: 'Chào mừng bạn đến với Finora - Tích Sản! Sổ tài chính của bạn đã sẵn sàng.',
        date: todayKey(),
        read: false
      }
    ],
    quickTemplates: structuredClone(seed.quickTemplates),
    incomeContracts: []
  };
}

export interface FinanceService {
  load(): Promise<FinanceData>;
  save(data: FinanceData): Promise<void>;
  getCurrentUser(): User | null;
  startGuestSession(): Promise<FinanceData>;
  registerUser(name: string, email: string, password?: string): Promise<FinanceData>;
  loginUser(email: string, password?: string): Promise<FinanceData>;
  oauthLoginUser(name: string, email: string, provider?: string): Promise<FinanceData>;
  logoutUser(): Promise<void>;
}

export const GUEST_USER: User = {
  id: 'usr_guest_local',
  name: 'Khách (Ngoại tuyến)',
  email: '',
  currency: 'VND',
  financialMonthStart: 1,
  plan: 'free',
  subscription_status: 'free',
  streakCount: 1,
  lastCheckInDate: todayKey(),
  defaultAccountId: 'wallet',
  nlpUsageToday: { date: todayKey(), count: 0 },
  isGuest: true
};

export const GUEST_MIGRATION_STORAGE_KEY = 'finora:guest_migration_data';
export const GUEST_COOKIE_NAME = 'tichsan_guest_migration';

export function stashGuestMigrationData(data?: FinanceData | null): void {
  if (typeof window === 'undefined') return;
  try {
    let toStash = data;
    if (!toStash) {
      const activeStorageKey = getActiveStorageKey();
      const raw = localStorage.getItem(activeStorageKey);
      if (raw) toStash = JSON.parse(raw);
    }
    if (!toStash) return;

    const payload = JSON.stringify(toStash);
    localStorage.setItem(GUEST_MIGRATION_STORAGE_KEY, payload);
    sessionStorage.setItem(GUEST_MIGRATION_STORAGE_KEY, payload);

    // Cross-subdomain cookie for *.tichsan.site
    const { hostname } = window.location;
    const isTichSanDomain = hostname.endsWith('tichsan.site');
    const domainAttr = isTichSanDomain ? '; domain=.tichsan.site' : '';
    if (payload.length < 3800) {
      document.cookie = `${GUEST_COOKIE_NAME}=${encodeURIComponent(payload)}; path=/; max-age=3600; SameSite=Lax${domainAttr}`;
    }
  } catch (err) {
    console.warn('[FinanceService] Không thể lưu tạm dữ liệu khách:', err);
  }
}

export function getGuestMigrationData(): FinanceData | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Check URL query params first (if passed via query redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const queryPayload = urlParams.get('guest_payload');
    if (queryPayload) {
      const decoded = decodeURIComponent(queryPayload);
      return JSON.parse(decoded) as FinanceData;
    }

    // 2. Check localStorage
    const local = localStorage.getItem(GUEST_MIGRATION_STORAGE_KEY);
    if (local) {
      return JSON.parse(local) as FinanceData;
    }

    // 3. Check sessionStorage
    const session = sessionStorage.getItem(GUEST_MIGRATION_STORAGE_KEY);
    if (session) {
      return JSON.parse(session) as FinanceData;
    }

    // 4. Check cross-subdomain cookie
    const match = document.cookie.match(new RegExp(`(?:^|; )${GUEST_COOKIE_NAME}=([^;]*)`));
    if (match && match[1]) {
      return JSON.parse(decodeURIComponent(match[1])) as FinanceData;
    }

    // 5. Fallback: Check if active user is currently a guest and has data in localStorage
    const authUserRaw = localStorage.getItem(AUTH_USER_KEY);
    if (authUserRaw) {
      const authUser = JSON.parse(authUserRaw) as User;
      if (authUser.isGuest) {
        const guestDataRaw = localStorage.getItem(`finora:user:${authUser.id}:v1`);
        if (guestDataRaw) {
          return JSON.parse(guestDataRaw) as FinanceData;
        }
      }
    }
  } catch (err) {
    console.warn('[FinanceService] Lỗi đọc dữ liệu di chuyển khách:', err);
  }
  return null;
}

export function clearGuestMigrationData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_MIGRATION_STORAGE_KEY);
    sessionStorage.removeItem(GUEST_MIGRATION_STORAGE_KEY);
    const { hostname } = window.location;
    const isTichSanDomain = hostname.endsWith('tichsan.site');
    const domainAttr = isTichSanDomain ? '; domain=.tichsan.site' : '';
    document.cookie = `${GUEST_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${domainAttr}`;
  } catch {}
}

export async function migrateGuestDataToUser(newUser: User, guestData: FinanceData): Promise<FinanceData> {
  const updatedTransactions = (guestData.transactions || []).map(tx => ({
    ...tx,
    userId: newUser.id
  }));
  const updatedAccounts = (guestData.accounts || []).map(acc => ({
    ...acc
  }));

  const migratedData: FinanceData = {
    ...guestData,
    user: {
      ...newUser,
      defaultAccountId: guestData.user?.defaultAccountId || updatedAccounts[0]?.id || 'wallet'
    },
    accounts: updatedAccounts.length > 0 ? updatedAccounts : getCleanEmptyFinanceData(newUser).accounts,
    transactions: updatedTransactions,
    categories: guestData.categories && guestData.categories.length > 0 ? guestData.categories : structuredClone(seed.categories),
    budgets: guestData.budgets || [],
    goals: guestData.goals || [],
    debts: guestData.debts || [],
    investments: guestData.investments || [],
    smartInvestmentNotes: guestData.smartInvestmentNotes || [],
    recurring: guestData.recurring || []
  };

  await offlineStorage.setUserData(newUser.id, migratedData);
  const storageKey = `finora:user:${newUser.id}:v1`;
  localStorage.setItem(storageKey, JSON.stringify(migratedData));

  // Queue bulk mutation to sync to server
  await outboxManager.enqueue(
    newUser.id,
    'bulk_sync',
    newUser.id,
    'UPDATE',
    migratedData,
    1
  );

  const token = getAuthToken();
  if (token && networkManager.getState() === 'ONLINE') {
    void outboxManager.syncOutbox(newUser.id, token);
  }

  clearGuestMigrationData();
  localStorage.setItem('finora:just_migrated_guest', 'true');
  return migratedData;
}

function migrateData(saved: any): FinanceData {
  const baseUser: User = saved?.user || {
    id: 'guest',
    name: 'Khách hàng Tích Sản',
    email: 'guest@finora.vn',
    currency: 'VND',
    financialMonthStart: 1,
    plan: 'free',
    subscription_status: 'free',
    streakCount: 1,
    lastCheckInDate: todayKey(),
    defaultAccountId: 'wallet',
    nlpUsageToday: { date: todayKey(), count: 0 }
  };

  const cleanBase = getCleanEmptyFinanceData(baseUser);

  const merged: FinanceData = {
    ...cleanBase,
    ...saved,
    user: {
      ...cleanBase.user,
      ...(saved.user || {}),
      plan: saved.user?.plan || 'free',
      streakCount: typeof saved.user?.streakCount === 'number' ? saved.user.streakCount : 1,
      lastCheckInDate: saved.user?.lastCheckInDate || todayKey(),
      defaultAccountId: saved.user?.defaultAccountId || (saved.accounts?.[0]?.id || 'wallet'),
      nlpUsageToday: saved.user?.nlpUsageToday || { date: todayKey(), count: 0 }
    },
    // Strictly preserve user's accounts, or if none, clean 0đ cash wallet
    accounts: Array.isArray(saved?.accounts) && saved.accounts.length > 0
      ? saved.accounts
      : cleanBase.accounts,
    transactions: Array.isArray(saved?.transactions) ? saved.transactions : [],
    categories: Array.isArray(saved?.categories) && saved.categories.length > 0
      ? saved.categories
      : structuredClone(seed.categories),
    budgets: Array.isArray(saved?.budgets) ? saved.budgets : [],
    goals: Array.isArray(saved?.goals) ? saved.goals : [],
    debts: Array.isArray(saved?.debts) ? saved.debts : [],
    investments: Array.isArray(saved?.investments) ? saved.investments : [],
    smartInvestmentNotes: Array.isArray(saved?.smartInvestmentNotes) ? saved.smartInvestmentNotes : [],
    quickTemplates: Array.isArray(saved?.quickTemplates) && saved.quickTemplates.length > 0 
      ? saved.quickTemplates 
      : structuredClone(seed.quickTemplates),
    incomeContracts: Array.isArray(saved?.incomeContracts)
      ? saved.incomeContracts
      : Array.isArray(cleanBase?.incomeContracts)
      ? cleanBase.incomeContracts
      : (seed.incomeContracts || []),
    recurring: Array.isArray(saved?.recurring)
      ? saved.recurring.map((r: any) => ({
          ...r,
          autoExecute: typeof r.autoExecute === 'boolean' ? r.autoExecute : false
        }))
      : []
  };

  // Phase 6 & Phase 10: Auto-check 30-Day VIP Gold Trial Expiry
  if (merged.user.subscription_status === 'trialing' && merged.user.trial_ends_at) {
    const endsAt = new Date(merged.user.trial_ends_at).getTime();
    if (Date.now() > endsAt) {
      merged.user.subscription_status = 'expired';
      merged.user.plan = 'free';
      merged.user.current_plan_id = 'plan-free';
    }
  }

  // Ensure reconcile categories exist
  const hasReconcileExp = merged.categories.some(c => c.id === 'reconcile-expense');
  if (!hasReconcileExp) {
    merged.categories.push({
      id: 'reconcile-expense',
      name: 'Điều chỉnh số dư / Quên ghi',
      type: 'expense',
      icon: 'Shapes',
      color: '#64748b',
      hidden: false
    });
  }
  const hasReconcileInc = merged.categories.some(c => c.id === 'reconcile-income');
  if (!hasReconcileInc) {
    merged.categories.push({
      id: 'reconcile-income',
      name: 'Điều chỉnh số dư / Quên ghi',
      type: 'income',
      icon: 'CircleDollarSign',
      color: '#10b981',
      hidden: false
    });
  }

  return merged;
}

export const mockFinanceService: FinanceService = {
  async load(): Promise<FinanceData> {
    const token = getAuthToken();
    const storageKey = getActiveStorageKey();
    const currentUser = this.getCurrentUser();
    const currentUserId = currentUser?.id || 'demo';

    // 1. Check local IndexedDB storage first
    let localData = await offlineStorage.getUserData(currentUserId);

    // 2. Anti-Abuse: Validate Signed Offline Lease & Clock Rollback Protection
    const lease = await offlineStorage.getLease(currentUserId);
    if (lease) {
      const leaseValidation = validateOfflineLease(lease);
      if (!leaseValidation.valid && localData && localData.user.subscription_status === 'trialing') {
        localData.user.subscription_status = 'expired';
        localData.user.plan = 'free';
        localData.user.current_plan_id = 'plan-free';
        await offlineStorage.setUserData(currentUserId, localData);
      }
    }

    // 3. Try fetching from real backend API if online
    if (networkManager.getState() !== 'OFFLINE') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/finance', { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const migrated = migrateData(json.data);
            await offlineStorage.setUserData(currentUserId, migrated);
            localStorage.setItem(storageKey, JSON.stringify(migrated));
            if (migrated.user && (token || currentUser)) {
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(migrated.user));
            }
            void outboxManager.refreshPendingCount(currentUserId);
            return migrated;
          }
        }
      } catch {
        // Network offline or standalone environment - fall through to local cache
      }
    }

    // 4. Fallback to Local-First IndexedDB database
    if (localData) {
      const migrated = migrateData(localData);
      if (currentUser && migrated.user.id === currentUser.id) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(migrated.user));
      }
      void outboxManager.refreshPendingCount(currentUserId);
      return migrated;
    }

    // 5. Secondary fallback to localStorage cache
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const migrated = migrateData(parsed);
        await offlineStorage.setUserData(currentUserId, migrated);
        void outboxManager.refreshPendingCount(currentUserId);
        return migrated;
      }
    } catch {}

    // 6. Fresh clean data initialization (clean empty initial account, no fake data)
    const freshData = getCleanEmptyFinanceData(
      currentUser || {
        id: currentUserId,
        name: 'Khách hàng Tích Sản',
        email: `${currentUserId}@finora.vn`,
        currency: 'VND',
        financialMonthStart: 1,
        plan: 'gold',
        subscription_status: 'trialing',
        streakCount: 1,
        lastCheckInDate: todayKey(),
        defaultAccountId: 'wallet',
        nlpUsageToday: { date: todayKey(), count: 0 }
      }
    );
    await offlineStorage.setUserData(currentUserId, freshData);
    void outboxManager.refreshPendingCount(currentUserId);
    return freshData;
  },

  async save(data: FinanceData): Promise<void> {
    const storageKey = getActiveStorageKey();
    const currentUserId = data.user.id || 'guest';

    // 1. Immediately persist to IndexedDB (Optimistic Local UI)
    await offlineStorage.setUserData(currentUserId, data);

    // Mirror to localStorage for secondary sync
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      const authUser = this.getCurrentUser();
      if (authUser && data.user.id === authUser.id) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      }
    } catch {}

    // 2. Queue mutation in Outbox
    await outboxManager.enqueue(
      currentUserId,
      'bulk_sync',
      currentUserId,
      'UPDATE',
      data,
      data.server_version || 1
    );

    // 3. If online, trigger background batch sync
    const token = getAuthToken();
    if (networkManager.getState() === 'ONLINE') {
      void outboxManager.syncOutbox(currentUserId, token);
    }
  },

  getCurrentUser(): User | null {
    try {
      // 1. Đồng bộ session nếu vừa chuyển tiếp qua query param
      if (typeof window !== 'undefined') {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const paramSession = urlParams.get('session');
          const paramToken = urlParams.get('token');
          if (paramSession) {
            localStorage.setItem(AUTH_USER_KEY, decodeURIComponent(paramSession));
            if (paramToken) {
              setAuthToken(decodeURIComponent(paramToken));
            }
            urlParams.delete('session');
            urlParams.delete('token');
            const cleanUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '') + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } catch {}
      }

      // 2. Kiểm tra môi trường Subdomain (*.tichsan.site)
      if (typeof window !== 'undefined') {
        const { hostname } = window.location;
        if (hostname.endsWith('tichsan.site')) {
          const cross = getCrossSubdomainUserSession();
          if (cross.user) {
            try {
              const parsed = JSON.parse(cross.user) as User;
              localStorage.setItem(AUTH_USER_KEY, cross.user);
              if (cross.token && !getAuthToken()) {
                setAuthToken(cross.token);
              }
              return parsed;
            } catch {}
          }
          // Không xóa vội AUTH_USER_KEY nếu cookie bị chặn/chưa đọc; tiếp tục fallback sang localStorage bên dưới
        }
      }

      let raw = localStorage.getItem(AUTH_USER_KEY);
      if (!raw) {
        const cross = getCrossSubdomainUserSession();
        if (cross.user) {
          raw = cross.user;
          localStorage.setItem(AUTH_USER_KEY, raw);
          if (cross.token && !getAuthToken()) {
            setAuthToken(cross.token);
          }
        }
      }
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async startGuestSession(): Promise<FinanceData> {
    const guestUser: User = { ...GUEST_USER };
    const guestUserJson = JSON.stringify(guestUser);
    localStorage.setItem(AUTH_USER_KEY, guestUserJson);
    setCrossSubdomainUserSession(guestUserJson);

    const existing = await offlineStorage.getUserData(guestUser.id);
    if (existing) {
      const migrated = migrateData(existing);
      localStorage.setItem(`finora:user:${guestUser.id}:v1`, JSON.stringify(migrated));
      return migrated;
    }

    const cleanData = getCleanEmptyFinanceData(guestUser);
    await offlineStorage.setUserData(guestUser.id, cleanData);
    localStorage.setItem(`finora:user:${guestUser.id}:v1`, JSON.stringify(cleanData));
    return cleanData;
  },

  async registerUser(name: string, email: string, password?: string): Promise<FinanceData> {
    const trimmedEmail = email.trim().toLowerCase();
    const guestMigration = getGuestMigrationData();

    // Clear local storage of any previous session to ensure clean slate
    await clearAllLocalUserData();

    const now = new Date();
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newUser: User = {
      id: `usr_${uid()}`,
      name: name.trim(),
      email: trimmedEmail,
      currency: 'VND',
      financialMonthStart: 1,
      plan: 'gold',
      subscription_status: 'trialing',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      current_plan_id: 'plan-gold',
      streakCount: 1,
      lastCheckInDate: todayKey(),
      defaultAccountId: 'wallet',
      nlpUsageToday: { date: todayKey(), count: 0 }
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: trimmedEmail,
          password,
          consent: {
            terms_version: '2026.11',
            subscription_policy_version: 'v1.0_vip_gold_trial',
            accepted_at: now.toISOString(),
            consent_type: 'trial_and_offline_sync'
          }
        })
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const errorMsg = json?.error || 'Đăng ký không thành công';
        throw new Error(errorMsg);
      }

      if (json.success && json.data) {
        const token = json.data.token || json.data.accessToken;
        setAuthToken(token);
        const registeredUser = json.data.user || newUser;
        const userJson = JSON.stringify(registeredUser);
        localStorage.setItem(AUTH_USER_KEY, userJson);
        setCrossSubdomainUserSession(userJson, token);

        if (guestMigration && (guestMigration.transactions?.length > 0 || guestMigration.accounts?.length > 0)) {
          return await migrateGuestDataToUser(registeredUser, guestMigration);
        }
        return this.load();
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) {
        throw err;
      }
      if (networkManager.getState() === 'ONLINE') {
        throw new Error(err?.message || 'Không thể đăng ký tài khoản. Vui lòng thử lại.');
      }
    }

    // Offline registration fallback with clean empty data or migrated guest data
    const lease = createSignedLease(newUser.id, 'plan-gold', 'gold', 30);
    await offlineStorage.setLease(lease);
    await offlineStorage.saveConsent({
      user_id: newUser.id,
      terms_version: '2026.11',
      subscription_policy_version: 'v1.0_vip_gold_trial',
      accepted_at: now.toISOString(),
      consent_type: 'trial_and_offline_sync'
    });

    const newUserJson = JSON.stringify(newUser);
    localStorage.setItem(AUTH_USER_KEY, newUserJson);
    setCrossSubdomainUserSession(newUserJson);

    if (guestMigration && (guestMigration.transactions?.length > 0 || guestMigration.accounts?.length > 0)) {
      return await migrateGuestDataToUser(newUser, guestMigration);
    }

    const freshData = getCleanEmptyFinanceData(newUser);
    await offlineStorage.setUserData(newUser.id, freshData);
    const storageKey = `finora:user:${newUser.id}:v1`;
    localStorage.setItem(storageKey, JSON.stringify(freshData));
    return freshData;
  },

  async loginUser(email: string, password?: string): Promise<FinanceData> {
    const trimmedEmail = email.trim().toLowerCase();
    const guestMigration = getGuestMigrationData();

    // Clear local storage of any previous session to ensure clean slate
    await clearAllLocalUserData();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json.data) {
        const token = json.data.token || json.data.accessToken;
        setAuthToken(token);
        const loggedUser = json.data.user;
        const userJson = JSON.stringify(loggedUser);
        localStorage.setItem(AUTH_USER_KEY, userJson);
        setCrossSubdomainUserSession(userJson, token);

        if (guestMigration && (guestMigration.transactions?.length > 0 || guestMigration.accounts?.length > 0)) {
          return await migrateGuestDataToUser(loggedUser, guestMigration);
        }
        return this.load();
      }

      const errorMsg = json?.error || 'Email hoặc mật khẩu không chính xác';
      throw new Error(errorMsg);
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) {
        throw err;
      }
      throw new Error(err?.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
    }
  },

  async oauthLoginUser(name: string, email: string, provider = 'google'): Promise<FinanceData> {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanName = (name || trimmedEmail.split('@')[0]).trim();
    const guestMigration = getGuestMigrationData();

    // Clear local storage of any previous session to ensure clean slate
    await clearAllLocalUserData();

    const now = new Date();
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newUser: User = {
      id: `usr_${uid()}`,
      name: cleanName,
      email: trimmedEmail,
      currency: 'VND',
      financialMonthStart: 1,
      plan: 'gold',
      subscription_status: 'trialing',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      current_plan_id: 'plan-gold',
      streakCount: 1,
      lastCheckInDate: todayKey(),
      defaultAccountId: 'wallet',
      nlpUsageToday: { date: todayKey(), count: 0 }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: trimmedEmail,
          provider,
          type_method_login: provider
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json?.data) {
        const token = json.data.token || json.data.accessToken;
        if (token) setAuthToken(token);
        const authedUser = json.data.user || newUser;
        const userJson = JSON.stringify(authedUser);
        localStorage.setItem(AUTH_USER_KEY, userJson);
        setCrossSubdomainUserSession(userJson, token);

        if (guestMigration && (guestMigration.transactions?.length > 0 || guestMigration.accounts?.length > 0)) {
          return await migrateGuestDataToUser(authedUser, guestMigration);
        }
        return this.load();
      }
    } catch {
      // Fall through to offline OAuth initialization
    }

    // Offline OAuth registration fallback with clean empty data or migrated guest data
    const lease = createSignedLease(newUser.id, 'plan-gold', 'gold', 30);
    await offlineStorage.setLease(lease);
    const newUserJson = JSON.stringify(newUser);
    localStorage.setItem(AUTH_USER_KEY, newUserJson);
    setCrossSubdomainUserSession(newUserJson);

    if (guestMigration && (guestMigration.transactions?.length > 0 || guestMigration.accounts?.length > 0)) {
      return await migrateGuestDataToUser(newUser, guestMigration);
    }

    const freshData = getCleanEmptyFinanceData(newUser);
    await offlineStorage.setUserData(newUser.id, freshData);
    const storageKey = `finora:user:${newUser.id}:v1`;
    localStorage.setItem(storageKey, JSON.stringify(freshData));
    return freshData;
  },

  async logoutUser(): Promise<void> {
    const token = getAuthToken();
    let currentUserId: string | undefined;
    try {
      const rawUser = localStorage.getItem(AUTH_USER_KEY);
      if (rawUser) {
        currentUserId = (JSON.parse(rawUser) as User)?.id;
      }
    } catch {}

    if (token || currentUserId) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ token, userId: currentUserId }),
          keepalive: true
        });
      } catch (err) {
        console.warn('[FinanceService] Logout API warning:', err);
      }
    }

    // Completely clear all local user data from localStorage and IndexedDB
    await clearAllLocalUserData();
  }
};
