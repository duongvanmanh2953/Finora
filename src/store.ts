import { create } from 'zustand';
import type { FinanceData } from './types';
import { mockFinanceService, getAuthToken } from './services/financeService';
import { networkManager, type NetworkState } from './lib/offline/networkStatus';
import { outboxManager } from './lib/offline/outboxManager';

export interface ToastInfo {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  severity?: 'success' | 'info' | 'warning' | 'error';
}

interface State {
  data: FinanceData | null;
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  toast: ToastInfo | null;
  lastSnapshot: FinanceData | null;
  pricingOpen: boolean;
  pricingFeature: string | undefined;
  networkState: NetworkState;
  pendingCount: number;
  syncNow: () => Promise<void>;
  load: () => Promise<void>;
  update: (fn: (data: FinanceData) => FinanceData, toastMessage?: string) => Promise<void>;
  undo: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  notify: (toast: string | ToastInfo) => void;
  clearToast: () => void;
  openPricing: (feature?: string) => void;
  closePricing: () => void;
  register: (name: string, email: string) => Promise<void>;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useFinance = create<State>((set, get) => {
  // Subscribe to real-time network and outbox events
  networkManager.subscribe((state, count) => {
    set({ networkState: state, pendingCount: count });
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('finora:reconnected', async () => {
      const current = get().data;
      if (!current) return;
      const userId = current.user.id || 'demo';
      get().notify({
        message: 'Kết nối đã được khôi phục. Đang đồng bộ...',
        severity: 'info'
      });
      const result = await outboxManager.syncOutbox(userId, getAuthToken());
      if (result.synced > 0) {
        get().notify({
          message: `Đồng bộ thành công ${result.synced} thay đổi.`,
          severity: 'success'
        });
      }
      if (result.requiresPlan > 0) {
        get().notify({
          message: 'Dùng thử VIP Gold đã kết thúc. Một số tính năng VIP tạm dừng.',
          severity: 'warning'
        });
      }
      await get().load();
    });
  }

  return {
    data: null,
    loading: true,
    error: null,
    theme: (typeof localStorage !== 'undefined' && localStorage.getItem('finora:theme') as 'light' | 'dark') || 'light',
    toast: null,
    lastSnapshot: null,
    pricingOpen: false,
    pricingFeature: undefined,
    networkState: networkManager.getState(),
    pendingCount: 0,

    syncNow: async () => {
      const current = get().data;
      if (!current) return;
      const userId = current.user.id || 'demo';
      get().notify({ message: 'Đang đồng bộ dữ liệu...', severity: 'info' });
      const result = await outboxManager.syncOutbox(userId, getAuthToken());
      if (result.synced > 0) {
        get().notify({ message: `Đã đồng bộ ${result.synced} thao tác`, severity: 'success' });
      } else if (result.failed > 0) {
        get().notify({ message: 'Không thể đồng bộ toàn bộ hàng đợi. Sẽ thử lại sau.', severity: 'warning' });
      } else {
        get().notify({ message: 'Dữ liệu đã được đồng bộ mới nhất', severity: 'info' });
      }
      await get().load();
    },

    load: async () => {
      try {
        set({ loading: true, error: null });
        const loaded = await mockFinanceService.load();
        set({ data: loaded, loading: false });
      } catch {
        set({ error: 'Không thể tải dữ liệu. Vui lòng thử lại.', loading: false });
      }
    },

  update: async (fn, toastMessage) => {
    const previous = get().data;
    if (!previous) return;
    const clonedPrev = structuredClone(previous);
    const next = fn(structuredClone(previous));
    try {
      await mockFinanceService.save(next);
      set({
        data: next,
        lastSnapshot: clonedPrev,
        toast: toastMessage
          ? {
              message: toastMessage,
              actionLabel: 'Hoàn tác',
              onAction: () => get().undo(),
              severity: 'success'
            }
          : {
              message: 'Đã lưu thay đổi',
              severity: 'success'
            }
      });
      setTimeout(() => {
        if (get().toast?.message === (toastMessage || 'Đã lưu thay đổi')) {
          set({ toast: null });
        }
      }, 5000);
    } catch {
      set({
        error: 'Không thể lưu thay đổi',
        toast: { message: 'Không thể lưu thay đổi', severity: 'error' }
      });
    }
  },

  undo: async () => {
    const snapshot = get().lastSnapshot;
    if (!snapshot) return;
    try {
      await mockFinanceService.save(snapshot);
      set({
        data: snapshot,
        lastSnapshot: null,
        toast: { message: 'Đã hoàn tác thao tác vừa rồi', severity: 'info' }
      });
    } catch {
      set({ toast: { message: 'Không thể hoàn tác', severity: 'error' } });
    }
  },

  setTheme: theme => {
    localStorage.setItem('finora:theme', theme);
    set({ theme });
  },

  notify: toast => {
    const info: ToastInfo =
      typeof toast === 'string'
        ? { message: toast, severity: 'success' }
        : toast;
    set({ toast: info });
    setTimeout(() => {
      if (get().toast?.message === info.message) {
        set({ toast: null });
      }
    }, 4500);
  },

  clearToast: () => set({ toast: null }),
  openPricing: feature => set({ pricingOpen: true, pricingFeature: feature }),
  closePricing: () => set({ pricingOpen: false, pricingFeature: undefined }),

  register: async (name: string, email: string) => {
    try {
      set({ loading: true, error: null });
      const nextData = await mockFinanceService.registerUser(name, email);
      set({ data: nextData, loading: false });
    } catch {
      set({ error: 'Không thể đăng ký tài khoản. Vui lòng thử lại.', loading: false });
    }
  },

  login: async (email: string) => {
    try {
      set({ loading: true, error: null });
      const nextData = await mockFinanceService.loginUser(email);
      set({ data: nextData, loading: false });
    } catch {
      set({ error: 'Không thể đăng nhập. Vui lòng thử lại.', loading: false });
    }
  },

  logout: async () => {
    mockFinanceService.logoutUser();
    await get().load();
  }
};
});
