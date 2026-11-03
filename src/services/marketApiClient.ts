import type {
  Instrument,
  MarketQuote,
  MarketCandle,
  CompanyProfile,
  MarketStatus,
  ProviderHealth
} from '../server/marketData/types';
import { VERIFIED_VN_MARKET_CATALOG } from '../lib/vietnamMarketService';

export class MarketApiClient {
  private baseUrl = '/api/market';

  public async getHealth(): Promise<ProviderHealth | null> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // offline / mock fallback
    }
    return null;
  }

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string; details?: any }> {
    try {
      const res = await fetch(`${this.baseUrl}/test-connection`, { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        latencyMs: 0,
        message: err?.message || 'Không thể kết nối đến máy chủ Finora Market API'
      };
    }
  }

  public async search(query: string): Promise<Instrument[]> {
    const q = (query || '').trim();
    if (!q) return [];

    try {
      const res = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // fallback to local catalog
    }

    // Local fallback search
    const upper = q.toUpperCase();
    return VERIFIED_VN_MARKET_CATALOG
      .filter(item => item.symbol.includes(upper) || item.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 20)
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
        isSupported: true
      }));
  }

  public async getQuote(symbol: string): Promise<MarketQuote | null> {
    const s = (symbol || '').trim().toUpperCase();
    if (!s) return null;

    try {
      const res = await fetch(`${this.baseUrl}/quote/${encodeURIComponent(s)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    // Check local catalog fallback
    const vnItem = VERIFIED_VN_MARKET_CATALOG.find(i => i.symbol === s);
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

    return null;
  }

  public async getCandles(
    symbol: string,
    resolution: string = 'D',
    from?: number,
    to?: number
  ): Promise<MarketCandle> {
    const s = (symbol || '').trim().toUpperCase();
    const end = to || Math.floor(Date.now() / 1000);
    const start = from || (end - 30 * 86400);

    try {
      const res = await fetch(
        `${this.baseUrl}/candles/${encodeURIComponent(s)}?resolution=${resolution}&from=${start}&to=${end}`
      );
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
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

  public async getProfile(symbol: string): Promise<CompanyProfile | null> {
    const s = (symbol || '').trim().toUpperCase();
    if (!s) return null;

    try {
      const res = await fetch(`${this.baseUrl}/profile/${encodeURIComponent(s)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const vnItem = VERIFIED_VN_MARKET_CATALOG.find(i => i.symbol === s);
    if (vnItem) {
      return {
        symbol: vnItem.symbol,
        companyName: vnItem.name,
        exchange: vnItem.exchangeOrIssuer,
        industry: vnItem.assetClass === 'stock' ? 'Cổ phiếu niêm yết' : 'Tài chính',
        country: 'VN',
        currency: vnItem.symbol === 'VANG-THEGIOI' ? 'USD' : 'VND',
        lastUpdatedAt: Date.now()
      };
    }

    return null;
  }

  public async getMarketStatus(exchange: string = 'US'): Promise<MarketStatus> {
    try {
      const res = await fetch(`${this.baseUrl}/status?exchange=${encodeURIComponent(exchange)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    return {
      exchange,
      isOpen: false,
      session: null,
      holiday: null,
      timestamp: Date.now()
    };
  }
}

export const marketApiClient = new MarketApiClient();

