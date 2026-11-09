import type { FinanceData, User } from '../types';
import { seed } from '../mocks/data';
import { todayKey, uid } from '../lib/finance';
import { offlineStorage } from '../lib/offline/indexedDbAdapter';
import { outboxManager } from '../lib/offline/outboxManager';
import { createSignedLease, validateOfflineLease } from '../lib/offline/signedLease';
import { networkManager } from '../lib/offline/networkStatus';

const DEMO_KEY = 'finora:demo:v1';
const AUTH_USER_KEY = 'finora:auth-user';
const AUTH_TOKEN_KEY = 'finora:auth-token';

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
  return DEMO_KEY;
}

export interface FinanceService {
  load(): Promise<FinanceData>;
  save(data: FinanceData): Promise<void>;
  getCurrentUser(): User | null;
  registerUser(name: string, email: string): Promise<FinanceData>;
  loginUser(email: string): Promise<FinanceData>;
  logoutUser(): void;
}

function migrateData(saved: any): FinanceData {
  const merged: FinanceData = {
    ...seed,
    ...saved,
    user: {
      ...seed.user,
      ...(saved.user || {}),
      plan: saved.user?.plan || 'free',
      streakCount: typeof saved.user?.streakCount === 'number' ? saved.user.streakCount : 1,
      lastCheckInDate: saved.user?.lastCheckInDate || todayKey(),
      defaultAccountId: saved.user?.defaultAccountId || (saved.accounts?.[0]?.id || 'wallet'),
      nlpUsageToday: saved.user?.nlpUsageToday || { date: todayKey(), count: 0 }
    },
    quickTemplates: Array.isArray(saved.quickTemplates) && saved.quickTemplates.length > 0 
      ? saved.quickTemplates 
      : seed.quickTemplates,
    recurring: (saved.recurring || seed.recurring).map((r: any) => ({
      ...r,
      autoExecute: typeof r.autoExecute === 'boolean' ? r.autoExecute : false
    }))
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
            if (migrated.user) {
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

    // 6. Fresh seed data initialization
    const freshData: FinanceData = {
      ...structuredClone(seed),
      user: currentUser ? { ...seed.user, ...currentUser } : seed.user
    };
    await offlineStorage.setUserData(currentUserId, freshData);
    void outboxManager.refreshPendingCount(currentUserId);
    return freshData;
  },

  async save(data: FinanceData): Promise<void> {
    const storageKey = getActiveStorageKey();
    const currentUserId = data.user.id || 'demo';

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
      const raw = localStorage.getItem(AUTH_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async registerUser(name: string, email: string): Promise<FinanceData> {
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newUser: User = {
      id: `usr_${uid()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
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

    // Save Signed Offline Lease & Consent Evidence
    const lease = createSignedLease(newUser.id, 'plan-gold', 'gold', 30);
    await offlineStorage.setLease(lease);
    await offlineStorage.saveConsent({
      user_id: newUser.id,
      terms_version: '2026.11',
      subscription_policy_version: 'v1.0_vip_gold_trial',
      accepted_at: now.toISOString(),
      consent_type: 'trial_and_offline_sync'
    });

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          consent: {
            terms_version: '2026.11',
            subscription_policy_version: 'v1.0_vip_gold_trial',
            accepted_at: now.toISOString(),
            consent_type: 'trial_and_offline_sync'
          }
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAuthToken(json.data.token);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(json.data.user));
          return this.load();
        }
      }
    } catch {
      // Offline local registration
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    const freshData: FinanceData = {
      ...structuredClone(seed),
      user: newUser
    };

    await offlineStorage.setUserData(newUser.id, freshData);
    const storageKey = `finora:user:${newUser.id}:v1`;
    localStorage.setItem(storageKey, JSON.stringify(freshData));
    return freshData;
  },

  async loginUser(email: string): Promise<FinanceData> {
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAuthToken(json.data.token);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(json.data.user));
          return this.load();
        }
      }
    } catch {
      // Fallback local login
    }

    let existingUser = this.getCurrentUser();

    if (!existingUser || existingUser.email !== trimmedEmail) {
      const now = new Date();
      existingUser = {
        id: `usr_${uid()}`,
        name: trimmedEmail.split('@')[0] || 'Khách hàng Finora',
        email: trimmedEmail,
        currency: 'VND',
        financialMonthStart: 1,
        plan: 'gold',
        subscription_status: 'trialing',
        trial_started_at: now.toISOString(),
        trial_ends_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        current_plan_id: 'plan-gold',
        streakCount: 1,
        lastCheckInDate: todayKey(),
        defaultAccountId: 'wallet',
        nlpUsageToday: { date: todayKey(), count: 0 }
      };

      const lease = createSignedLease(existingUser.id, 'plan-gold', 'gold', 30);
      await offlineStorage.setLease(lease);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(existingUser));
    }

    return this.load();
  },

  logoutUser(): void {
    const token = getAuthToken();
    if (token) {
      try {
        void fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    }
    setAuthToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
  }
};
