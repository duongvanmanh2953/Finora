import { FinnhubClient, FinnhubApiError } from './finnhubClient';
import { MarketDataCache } from './cache';
import { FinnhubValidator } from './validator';
import type {
  MarketQuote,
  MarketCandle,
  CompanyProfile,
  MarketStatus,
  Instrument,
  ProviderHealth
} from './types';
import { VERIFIED_VN_MARKET_CATALOG } from '../../lib/vietnamMarketService';

export interface MarketDataServiceOptions {
  client?: FinnhubClient;
  cache?: MarketDataCache;
}

export class MarketDataService {
  private client: FinnhubClient;
  private cache: MarketDataCache;

  // Operational metrics
  private totalRequests = 0;
  private rateLimitHits = 0;
  private authErrorHits = 0;
  private lastSuccessfulRequestAt: number | null = null;
  private lastErrorAt: number | null = null;
  private lastErrorMessage: string | null = null;
  private latencySamples: number[] = [];

  constructor(options?: MarketDataServiceOptions) {
    this.client = options?.client ?? new FinnhubClient();
    this.cache = options?.cache ?? new MarketDataCache();
  }

  public getHealth(): ProviderHealth {
    const isConfigured = this.client.isConfigured();
    const avgLatency = this.latencySamples.length > 0
      ? Math.round(this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length)
      : 0;

    let status: ProviderHealth['status'] = 'healthy';
    if (!isConfigured) {
      status = 'unconfigured';
    } else if (this.authErrorHits > 0) {
      status = 'error';
    } else if (this.rateLimitHits > 0 || this.lastErrorAt && (Date.now() - this.lastErrorAt < 30000)) {
      status = 'degraded';
    }

    return {
      provider: 'finnhub',
      status,
      isKeyConfigured: isConfigured,
      maskedKey: this.client.getMaskedKey(),
      lastSuccessfulRequestAt: this.lastSuccessfulRequestAt,
      lastErrorAt: this.lastErrorAt,
      lastErrorMessage: this.lastErrorMessage,
      totalRequests: this.totalRequests,
      rateLimitHits: this.rateLimitHits,
      authErrorHits: this.authErrorHits,
      averageLatencyMs: avgLatency
    };
  }

  private recordLatency(ms: number) {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > 25) {
      this.latencySamples.shift();
    }
  }

  public async testConnection(): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
    details?: any;
  }> {
    if (!this.client.isConfigured()) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Chưa cấu hình FINNHUB_API_KEY trong tệp backend .env'
      };
    }

    const start = Date.now();
    try {
      this.totalRequests++;
      // Probe US market status (lightweight verified endpoint)
      const data = await this.client.request('/stock/market-status', { exchange: 'US' });
      const latencyMs = Date.now() - start;
      this.recordLatency(latencyMs);
      this.lastSuccessfulRequestAt = Date.now();

      return {
        success: true,
        latencyMs,
        message: 'Kết nối Finnhub API v1 thành công! Trạng thái thị trường US đã xác thực.',
        details: data
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      this.lastErrorAt = Date.now();
      this.lastErrorMessage = err?.message || 'Lỗi kết nối';

      if (err instanceof FinnhubApiError) {
        if (err.isAuthError) this.authErrorHits++;
        if (err.isRateLimit) this.rateLimitHits++;
      }

      return {
        success: false,
        latencyMs,
        message: err?.message || 'Không thể kết nối đến Finnhub API'
      };
    }
  }

  /**
   * Search instruments across Finnhub global database and Finora verified Vietnamese catalog
   */
  public async search(query: string): Promise<Instrument[]> {
    const q = (query || '').trim().toUpperCase();
    if (!q) return [];

    const cacheKey = `search:${q}`;
    return this.cache.getOrFetch(cacheKey, 600, async () => {
      // 1. Search in verified local Vietnamese catalog first (instant match)
      const vnMatches: Instrument[] = VERIFIED_VN_MARKET_CATALOG
        .filter(item =>
          item.symbol.includes(q) ||
          item.name.toLowerCase().includes(q.toLowerCase())
        )
        .slice(0, 15)
        .map(item => ({
          id: `vn-${item.symbol}`,
          symbol: item.symbol,
          name: item.name,
          assetType: item.assetClass === 'fund' ? 'fund' : item.assetClass === 'bond' ? 'bond' : item.assetClass === 'gold' ? 'gold' : 'stock',
          exchange: item.exchangeOrIssuer,
          currency: item.symbol === 'VANG-THEGIOI' ? 'USD' : 'VND',
          country: 'VN',
          provider: 'vietnam_catalog',
          providerSymbol: item.symbol,
          isSupported: true,
          updatedAt: new Date().toISOString()
        }));

      // 2. Query Finnhub symbol search if configured
      let finnhubMatches: Instrument[] = [];
      if (this.client.isConfigured()) {
        try {
          this.totalRequests++;
          const start = Date.now();
          const raw = await this.client.request('/search', { q });
          this.recordLatency(Date.now() - start);
          this.lastSuccessfulRequestAt = Date.now();
          finnhubMatches = FinnhubValidator.normalizeSearchResult(raw);
        } catch (err: any) {
          this.lastErrorAt = Date.now();
          this.lastErrorMessage = err?.message || 'Search error';
          if (err instanceof FinnhubApiError) {
            if (err.isAuthError) this.authErrorHits++;
            if (err.isRateLimit) this.rateLimitHits++;
          }
        }
      }

      // Merge results with unique symbol deduplication
      const seen = new Set<string>();
      const combined: Instrument[] = [];

      for (const item of [...vnMatches, ...finnhubMatches]) {
        if (!seen.has(item.symbol)) {
          seen.add(item.symbol);
          combined.push(item);
        }
      }

      return combined.slice(0, 30);
    });
  }

  /**
   * Get latest stock quote
   */
  public async getQuote(symbol: string): Promise<MarketQuote | null> {
    const s = (symbol || '').trim().toUpperCase();
    if (!s) return null;

    const cacheKey = `quote:${s}`;
    return this.cache.getOrFetch(cacheKey, 60, async () => {
      // 1. Check verified Vietnamese catalog
      const vnItem = VERIFIED_VN_MARKET_CATALOG.find(item => item.symbol === s);
      if (vnItem) {
        return {
          symbol: vnItem.symbol,
          currentPrice: vnItem.referencePrice,
          change: 0,
          changePercent: 0,
          dayHigh: vnItem.referencePrice,
          dayLow: vnItem.referencePrice,
          open: vnItem.referencePrice,
          previousClose: vnItem.referencePrice,
          currency: vnItem.symbol === 'VANG-THEGIOI' ? 'USD' : 'VND',
          marketTimestamp: Date.now(),
          fetchedAt: Date.now(),
          source: 'vietnam_catalog',
          dataStatus: 'reference'
        };
      }

      // 2. Fetch from Finnhub if configured
      if (!this.client.isConfigured()) {
        return null;
      }

      try {
        this.totalRequests++;
        const start = Date.now();
        const raw = await this.client.request('/quote', { symbol: s });
        this.recordLatency(Date.now() - start);
        this.lastSuccessfulRequestAt = Date.now();

        const quote = FinnhubValidator.normalizeQuote(s, raw);
        return quote;
      } catch (err: any) {
        this.lastErrorAt = Date.now();
        this.lastErrorMessage = err?.message || 'Quote error';
        if (err instanceof FinnhubApiError) {
          if (err.isAuthError) this.authErrorHits++;
          if (err.isRateLimit) this.rateLimitHits++;
        }
        return null;
      }
    });
  }

  /**
   * Get historical candlestick data (OHLCV)
   */
  public async getCandles(
    symbol: string,
    resolution: string = 'D',
    from: number,
    to: number
  ): Promise<MarketCandle> {
    const s = (symbol || '').trim().toUpperCase();
    const cacheKey = `candle:${s}:${resolution}:${from}:${to}`;

    return this.cache.getOrFetch(cacheKey, 300, async () => {
      if (!this.client.isConfigured()) {
        return {
          symbol: s,
          resolution,
          open: [],
          high: [],
          low: [],
          close: [],
          volume: [],
          timestamp: [],
          source: 'finnhub',
          status: 'no_data'
        };
      }

      try {
        this.totalRequests++;
        const start = Date.now();
        const raw = await this.client.request('/stock/candle', {
          symbol: s,
          resolution,
          from,
          to
        });
        this.recordLatency(Date.now() - start);
        this.lastSuccessfulRequestAt = Date.now();

        const candle = FinnhubValidator.normalizeCandle(s, resolution, raw);
        return candle || {
          symbol: s,
          resolution,
          open: [],
          high: [],
          low: [],
          close: [],
          volume: [],
          timestamp: [],
          source: 'finnhub',
          status: 'no_data'
        };
      } catch (err: any) {
        this.lastErrorAt = Date.now();
        this.lastErrorMessage = err?.message || 'Candle error';
        if (err instanceof FinnhubApiError) {
          if (err.isAuthError) this.authErrorHits++;
          if (err.isRateLimit) this.rateLimitHits++;
        }

        return {
          symbol: s,
          resolution,
          open: [],
          high: [],
          low: [],
          close: [],
          volume: [],
          timestamp: [],
          source: 'finnhub',
          status: 'no_data'
        };
      }
    });
  }

  /**
   * Get company profile & official logo
   */
  public async getProfile(symbol: string): Promise<CompanyProfile | null> {
    const s = (symbol || '').trim().toUpperCase();
    if (!s) return null;

    const cacheKey = `profile:${s}`;
    return this.cache.getOrFetch(cacheKey, 86400, async () => {
      // Check domestic catalog
      const vnItem = VERIFIED_VN_MARKET_CATALOG.find(item => item.symbol === s);
      if (vnItem) {
        return {
          symbol: vnItem.symbol,
          companyName: vnItem.name,
          exchange: vnItem.exchangeOrIssuer,
          industry: vnItem.assetClass === 'stock' ? 'Cổ phiếu niêm yết' : 'Tài sản tài chính',
          country: 'VN',
          currency: vnItem.symbol === 'VANG-THEGIOI' ? 'USD' : 'VND',
          lastUpdatedAt: Date.now()
        };
      }

      if (!this.client.isConfigured()) return null;

      try {
        this.totalRequests++;
        const start = Date.now();
        const raw = await this.client.request('/stock/profile2', { symbol: s });
        this.recordLatency(Date.now() - start);
        this.lastSuccessfulRequestAt = Date.now();

        return FinnhubValidator.normalizeProfile(s, raw);
      } catch (err: any) {
        this.lastErrorAt = Date.now();
        this.lastErrorMessage = err?.message || 'Profile error';
        if (err instanceof FinnhubApiError) {
          if (err.isAuthError) this.authErrorHits++;
          if (err.isRateLimit) this.rateLimitHits++;
        }
        return null;
      }
    });
  }

  /**
   * Get exchange trading session status
   */
  public async getMarketStatus(exchange: string = 'US'): Promise<MarketStatus> {
    const ex = (exchange || 'US').trim().toUpperCase();
    const cacheKey = `status:${ex}`;

    return this.cache.getOrFetch(cacheKey, 300, async () => {
      if (!this.client.isConfigured()) {
        return {
          exchange: ex,
          isOpen: false,
          session: null,
          holiday: null,
          timestamp: Date.now()
        };
      }

      try {
        this.totalRequests++;
        const start = Date.now();
        const raw = await this.client.request('/stock/market-status', { exchange: ex });
        this.recordLatency(Date.now() - start);
        this.lastSuccessfulRequestAt = Date.now();

        return FinnhubValidator.normalizeMarketStatus(ex, raw);
      } catch (err: any) {
        this.lastErrorAt = Date.now();
        this.lastErrorMessage = err?.message || 'Market status error';
        if (err instanceof FinnhubApiError) {
          if (err.isAuthError) this.authErrorHits++;
          if (err.isRateLimit) this.rateLimitHits++;
        }

        return {
          exchange: ex,
          isOpen: false,
          session: null,
          holiday: null,
          timestamp: Date.now()
        };
      }
    });
  }
}

// Singleton instance for server runtime
export const marketDataService = new MarketDataService();

