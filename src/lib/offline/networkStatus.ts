export type NetworkState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNC_FAILED' | 'SYNC_CONFLICT';

type NetworkListener = (state: NetworkState, pendingCount: number) => void;

class NetworkManager {
  private currentState: NetworkState = typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE';
  private listeners: Set<NetworkListener> = new Set();
  private pendingCount = 0;
  private pingIntervalId: any = null;
  private debounceTimer: any = null;
  private lastPingSuccessTime = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkEvent(true));
      window.addEventListener('offline', () => this.handleNetworkEvent(false));
      // Periodic health check ping every 30 seconds
      this.pingIntervalId = setInterval(() => this.checkRealConnection(), 30000);
      // Initial ping check
      setTimeout(() => this.checkRealConnection(), 1500);
    }
  }

  private handleNetworkEvent(isOnline: boolean) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (!isOnline) {
        this.setState('OFFLINE');
      } else {
        void this.checkRealConnection();
      }
    }, 800); // 800ms debounce prevents rapid flapping
  }

  public async checkRealConnection(): Promise<boolean> {
    if (typeof fetch === 'undefined') return true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.lastPingSuccessTime = Date.now();
        if (this.currentState === 'OFFLINE') {
          this.setState('ONLINE');
          // Dispatched reconnected event for sync triggers
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('finora:reconnected'));
          }
        }
        return true;
      } else {
        this.setState('OFFLINE');
        return false;
      }
    } catch {
      this.setState('OFFLINE');
      return false;
    }
  }

  public getLastPingSuccessTime(): number {
    return this.lastPingSuccessTime;
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
