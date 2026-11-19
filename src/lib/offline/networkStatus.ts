export type NetworkState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNC_FAILED' | 'SYNC_CONFLICT';

export interface NetworkCheckResult {
  isOnline: boolean;
  state: NetworkState;
  latencyMs: number;
  serverReachable: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'offline' | 'unknown';
  label: string;
  timestamp: number;
  summary: string;
}

export interface NetworkToastPayload {
  id?: string;
  type: 'online' | 'offline' | 'warning' | 'syncing';
  title: string;
  message: string;
  latencyMs?: number;
  duration?: number; // Duration in ms, defaults to 3000ms (3s)
}

type NetworkListener = (state: NetworkState, pendingCount: number) => void;

class NetworkManager {
  // Correctly detect initial offline state from browser navigator
  private currentState: NetworkState =
    typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'ONLINE';
  private listeners: Set<NetworkListener> = new Set();
  private pendingCount = 0;
  private pingIntervalId: any = null;
  private debounceTimer: any = null;
  private lastPingSuccessTime = Date.now();
  private lastLatencyMs = 28;
  private lastServerReachable = true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkEvent(true));
      window.addEventListener('offline', () => this.handleNetworkEvent(false));
      // Periodic health check ping every 30 seconds
      this.pingIntervalId = setInterval(() => {
        void this.checkRealConnection({ silent: true });
      }, 30000);
      // Initial ping check via real API call
      setTimeout(() => {
        void this.checkRealConnection({ silent: true });
      }, 800);
    }
  }

  private handleNetworkEvent(isOnline: boolean) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (!isOnline) {
      // Immediate offline transition when OS / browser triggers offline event
      this.setState('OFFLINE');
      dispatchNetworkToast({
        type: 'offline',
        title: 'Mất kết nối mạng',
        message: 'Thiết bị đang ngoại tuyến. Chế độ Offline-First đang ghi nhớ an toàn các thao tác.',
        duration: 3000
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('finora:network-check-completed', {
            detail: {
              isOnline: false,
              state: 'OFFLINE',
              latencyMs: 0,
              serverReachable: false,
              connectionType: 'offline',
              label: 'Ngoại tuyến (Mất mạng)',
              timestamp: Date.now(),
              summary: 'Thiết bị đang ngắt kết nối mạng.'
            }
          })
        );
      }
      return;
    }

    // Debounce slightly when reconnecting to let network adapter settle, then verify with real API call
    this.debounceTimer = setTimeout(() => {
      void this.checkRealConnection({ silent: false, userInitiated: false });
    }, 400);
  }

  /**
   * Multi-endpoint lightweight internet connectivity probe running concurrently
   */
  private async probeInternetConnectivity(timeoutMs = 3500): Promise<boolean> {
    if (typeof fetch === 'undefined') return true;

    const endpoints = [
      'https://cloudflare.com/cdn-cgi/trace',
      'https://1.1.1.1/cdn-cgi/trace',
      'https://www.google.com/generate_204',
      'https://connectivitycheck.gstatic.com/generate_204',
      'https://www.msftconnecttest.com/connecttest.txt'
    ];

    const pingOne = async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        }).catch(async () => {
          return fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal
          });
        });
        clearTimeout(timeoutId);
        return true;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      // Return true as soon as ANY probe succeeds
      await Promise.any(endpoints.map((url) => pingOne(url)));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper to ping Finora backend health endpoint
   */
  private async pingServerHealth(timeoutMs = 3000): Promise<boolean> {
    if (typeof fetch === 'undefined') return true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`/api/health?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Comprehensive network & server connectivity check by calling real APIs
   * Reliably detects online state whether on localhost, remote server, or behind proxies
   */
  public async checkRealConnection(options?: {
    silent?: boolean;
    userInitiated?: boolean;
  }): Promise<NetworkCheckResult> {
    // 0. Strict browser offline check: if navigator.onLine is false, device has no network
    const isBrowserOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
    if (!isBrowserOnline) {
      this.setState('OFFLINE');
      const offlineResult: NetworkCheckResult = {
        isOnline: false,
        state: 'OFFLINE',
        latencyMs: 0,
        serverReachable: false,
        connectionType: 'offline',
        label: 'Ngoại tuyến (Mất mạng)',
        timestamp: Date.now(),
        summary: 'Thiết bị đang ngắt kết nối Internet.'
      };

      if (!options?.silent) {
        dispatchNetworkToast({
          type: 'offline',
          title: options?.userInitiated ? 'Kiểm tra mạng: Ngoại tuyến' : 'Mất kết nối mạng',
          message: 'Không có kết nối mạng Internet. Chế độ Offline-First đang lưu an toàn dữ liệu.',
          duration: 3000
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finora:network-check-completed', { detail: offlineResult }));
      }

      return offlineResult;
    }

    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // 1. Run parallel server ping and fast public internet probes
    const [serverOk, internetReachable] = await Promise.all([
      this.pingServerHealth(3000).catch(() => false),
      this.probeInternetConnectivity(3500).catch(() => false)
    ]);

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const measuredLatency = Math.max(12, Math.round(endTime - startTime));
    this.lastLatencyMs = measuredLatency;
    this.lastServerReachable = serverOk;

    // Device is online if:
    // - Server responded, OR
    // - Public probe succeeded, OR
    // - Browser explicitly reports navigator.onLine === true (fallback for corporate networks/adblockers)
    const isOnline = isBrowserOnline && (serverOk || internetReachable || isBrowserOnline);

    if (isOnline) {
      this.lastPingSuccessTime = Date.now();
      const previousState = this.currentState;

      if (previousState === 'OFFLINE' || previousState === 'SYNC_FAILED') {
        this.setState('ONLINE');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finora:reconnected'));
        }
      } else if (this.currentState !== 'SYNCING' && this.currentState !== 'SYNC_CONFLICT') {
        this.setState('ONLINE');
      }

      let label = 'Trực tuyến (Máy chủ Finora)';
      let summary = `Đường truyền trực tuyến ổn định (${measuredLatency}ms) • Máy chủ Finora sẵn sàng.`;
      let toastTitle = options?.userInitiated ? 'Kiểm tra mạng: Trực tuyến' : 'Đã kết nối';
      let toastMessage = `Độ trễ phản hồi: ${measuredLatency}ms • Máy chủ đồng bộ sẵn sàng`;
      let toastType: 'online' | 'warning' = 'online';

      if (serverOk) {
        label = 'Trực tuyến (Máy chủ Finora)';
        summary = `Đường truyền trực tuyến ổn định (${measuredLatency}ms) • Máy chủ Finora sẵn sàng.`;
        toastMessage = `Độ trễ phản hồi: ${measuredLatency}ms • Máy chủ đồng bộ sẵn sàng`;
      } else if (internetReachable) {
        label = 'Trực tuyến (Internet)';
        summary = `Có kết nối Internet (${measuredLatency}ms) • Chế độ Offline-First bảo vệ dữ liệu.`;
        toastMessage = `Kết nối Internet ổn định (${measuredLatency}ms) • Chế độ Offline-First bảo vệ dữ liệu`;
      } else {
        // Browser is online, but both server and public probes failed (e.g. adblocker, strict firewall, or internal LAN)
        label = 'Trực tuyến (Mạng nội bộ)';
        summary = 'Thiết bị đang có kết nối mạng. Máy chủ Finora tạm thời chờ phản hồi.';
        toastType = 'warning';
        toastTitle = options?.userInitiated ? 'Kiểm tra mạng: Đã kết nối' : 'Đã kết nối';
        toastMessage = 'Thiết bị đang có kết nối mạng Internet. Chế độ Offline-First đang lưu an toàn dữ liệu.';
      }

      const result: NetworkCheckResult = {
        isOnline: true,
        state: this.currentState,
        latencyMs: measuredLatency,
        serverReachable: serverOk,
        connectionType: 'wifi',
        label,
        timestamp: Date.now(),
        summary
      };

      if (!options?.silent) {
        dispatchNetworkToast({
          type: toastType,
          title: toastTitle,
          message: toastMessage,
          latencyMs: measuredLatency,
          duration: 3000
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finora:network-check-completed', { detail: result }));
      }

      return result;
    } else {
      // Both internet probes failed and browser is offline -> definitely offline
      this.setState('OFFLINE');
      const result: NetworkCheckResult = {
        isOnline: false,
        state: 'OFFLINE',
        latencyMs: 0,
        serverReachable: false,
        connectionType: 'offline',
        label: 'Ngoại tuyến (Mất mạng)',
        timestamp: Date.now(),
        summary: 'Không có kết nối Internet.'
      };

      if (!options?.silent) {
        dispatchNetworkToast({
          type: 'offline',
          title: options?.userInitiated ? 'Kiểm tra mạng: Ngoại tuyến' : 'Mất kết nối mạng',
          message: 'Không có kết nối Internet. Chế độ Offline-First đang ghi nhớ an toàn các thao tác.',
          duration: 3000
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finora:network-check-completed', { detail: result }));
      }

      return result;
    }
  }

  public getLastPingSuccessTime(): number {
    return this.lastPingSuccessTime;
  }

  public getLastLatency(): number {
    return this.lastLatencyMs;
  }

  public isServerReachable(): boolean {
    return this.lastServerReachable;
  }

  public getState(): NetworkState {
    return this.currentState;
  }

  public getPendingCount(): number {
    return this.pendingCount;
  }

  public setPendingCount(count: number) {
    this.pendingCount = count;
    this.notify();
  }

  public setState(newState: NetworkState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.notify();
    }
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState, this.pendingCount);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentState, this.pendingCount);
      } catch (err) {
        console.error('Error in network listener', err);
      }
    }
  }

  public cleanup() {
    if (this.pingIntervalId) clearInterval(this.pingIntervalId);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}

export const networkManager = new NetworkManager();

/**
 * Dispatch top-down 3s notification popup
 */
export function dispatchNetworkToast(payload: NetworkToastPayload) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('finora:network-toast', {
        detail: {
          id: payload.id || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          duration: payload.duration ?? 3000,
          ...payload
        }
      })
    );
  }
}

/**
 * Subscribe to top-down network toasts
 */
export function subscribeNetworkToast(callback: (payload: NetworkToastPayload) => void): () => void {
  if (typeof window === 'undefined') return () => () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<NetworkToastPayload>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener('finora:network-toast', handler);
  return () => window.removeEventListener('finora:network-toast', handler);
}

export function getConnectionDetails(forcedOnline?: boolean): {
  isOnline: boolean;
  type: 'wifi' | 'cellular' | 'ethernet' | 'offline' | 'unknown';
  label: string;
} {
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isOnline =
    forcedOnline !== undefined
      ? forcedOnline
      : !browserOffline && networkManager.getState() !== 'OFFLINE';
  if (!isOnline) {
    return { isOnline: false, type: 'offline', label: 'Ngoại tuyến (Mất mạng)' };
  }

  // Pure API-driven connection status without requesting device network permissions
  const serverReachable = networkManager.isServerReachable();
  return {
    isOnline: true,
    type: 'wifi',
    label: serverReachable ? 'Trực tuyến (Máy chủ Finora)' : 'Trực tuyến (Internet)'
  };
}
