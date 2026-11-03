import type {
  MarketQuote,
  MarketCandle,
  CompanyProfile,
  MarketStatus,
  Instrument
} from './types';

export class FinnhubValidator {
  public static normalizeQuote(symbol: string, raw: any): MarketQuote | null {
    if (!raw || typeof raw !== 'object') return null;

    const currentPrice = Number(raw.c ?? 0);
    const prevClose = Number(raw.pc ?? 0);

    // Finnhub returns all zeros when a symbol is nonexistent or unsupported
    if (currentPrice === 0 && prevClose === 0) {
      return null;
    }

    const change = Number(raw.d ?? (currentPrice - prevClose));
    const changePercent = Number(raw.dp ?? (prevClose > 0 ? (change / prevClose) * 100 : 0));
    const dayHigh = Number(raw.h ?? currentPrice);
    const dayLow = Number(raw.l ?? currentPrice);
    const open = Number(raw.o ?? currentPrice);
    const marketTimestamp = Number(raw.t ? raw.t * 1000 : Date.now());

    return {
      symbol: symbol.toUpperCase(),
      currentPrice,
      change,
      changePercent,
      dayHigh,
      dayLow,
      open,
      previousClose: prevClose,
      currency: 'USD',
      marketTimestamp,
      fetchedAt: Date.now(),
      source: 'finnhub',
      dataStatus: 'realtime'
    };
  }

  public static normalizeCandle(symbol: string, resolution: string, raw: any): MarketCandle | null {
    if (!raw || typeof raw !== 'object' || raw.s !== 'ok') {
      return {
        symbol: symbol.toUpperCase(),
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

    const open = Array.isArray(raw.o) ? raw.o.map(Number) : [];
    const high = Array.isArray(raw.h) ? raw.h.map(Number) : [];
    const low = Array.isArray(raw.l) ? raw.l.map(Number) : [];
    const close = Array.isArray(raw.c) ? raw.c.map(Number) : [];
    const volume = Array.isArray(raw.v) ? raw.v.map(Number) : [];
    const timestamp = Array.isArray(raw.t) ? raw.t.map((t: number) => t * 1000) : [];

    return {
      symbol: symbol.toUpperCase(),
      resolution,
      open,
      high,
      low,
      close,
      volume,
      timestamp,
      source: 'finnhub',
      status: 'ok'
    };
  }

  public static normalizeProfile(symbol: string, raw: any): CompanyProfile | null {
    if (!raw || typeof raw !== 'object' || (!raw.name && !raw.ticker)) {
      return null;
    }

    return {
      symbol: (raw.ticker || symbol).toUpperCase(),
      companyName: String(raw.name || symbol),
      exchange: String(raw.exchange || 'US'),
      industry: String(raw.finnhubIndustry || 'General'),
      country: String(raw.country || 'US'),
      currency: String(raw.currency || 'USD'),
      marketCapitalization: raw.marketCapitalization ? Number(raw.marketCapitalization) : undefined,
      logoUrl: raw.logo ? String(raw.logo) : undefined,
      weburl: raw.weburl ? String(raw.weburl) : undefined,
      lastUpdatedAt: Date.now()
    };
  }

  public static normalizeSearchResult(raw: any): Instrument[] {
    if (!raw || !Array.isArray(raw.result)) return [];

    return raw.result
      .filter((item: any) => item && item.symbol)
      .map((item: any) => {
        const symbol = String(item.symbol).toUpperCase();
        const typeStr = String(item.type || '').toLowerCase();
        const assetType: Instrument['assetType'] = typeStr.includes('etp') || typeStr.includes('etf')
          ? 'etf'
          : typeStr.includes('crypto')
          ? 'crypto'
          : 'stock';

        return {
          id: `finnhub-${symbol}`,
          symbol,
          name: String(item.description || symbol),
          assetType,
          exchange: String(item.displaySymbol || symbol).includes('.')
            ? symbol.split('.')[1]
            : 'US',
          currency: 'USD',
          country: 'US',
          provider: 'finnhub' as const,
          providerSymbol: symbol,
          isSupported: true,
          updatedAt: new Date().toISOString()
        };
      });
  }

  public static normalizeMarketStatus(exchange: string, raw: any): MarketStatus {
    return {
      exchange: exchange.toUpperCase(),
      isOpen: Boolean(raw?.isOpen),
      session: raw?.session ? String(raw.session) : null,
      holiday: raw?.holiday ? String(raw.holiday) : null,
      timezone: raw?.timezone ? String(raw.timezone) : undefined,
      timestamp: Date.now()
    };
  }
}

