export type DataFreshness =
  | 'realtime'
  | 'delayed'
  | 'reference'
  | 'manual'
  | 'unavailable';

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'etf' | 'fund' | 'bond' | 'gold' | 'crypto';
  exchange: string;
  currency: string;
  country: string;
  logoUrl?: string;
  provider: 'finnhub' | 'vietnam_catalog' | 'manual';
  providerSymbol: string;
  providerMetadata?: Record<string, any>;
  isSupported: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  currency: string;
  marketTimestamp: number;
  fetchedAt: number;
  source: 'finnhub' | 'vietnam_catalog' | 'manual';
  dataStatus: DataFreshness;
  isStale?: boolean;
}

export interface MarketCandle {
  symbol: string;
  resolution: string;
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  timestamp: number[];
  source: 'finnhub' | 'vietnam_catalog';
  status: 'ok' | 'no_data';
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  exchange: string;
  industry: string;
  country: string;
  currency: string;
  marketCapitalization?: number;
  logoUrl?: string;
  weburl?: string;
  lastUpdatedAt: number;
}

export interface MarketStatus {
  exchange: string;
  isOpen: boolean;
  session: string | null;
  holiday: string | null;
  timezone?: string;
  timestamp: number;
}

export interface ProviderHealth {
  provider: 'finnhub';
  status: 'healthy' | 'degraded' | 'unconfigured' | 'error';
  isKeyConfigured: boolean;
  maskedKey: string;
  lastSuccessfulRequestAt: number | null;
  lastErrorAt: number | null;
  lastErrorMessage: string | null;
  totalRequests: number;
  rateLimitHits: number;
  authErrorHits: number;
  averageLatencyMs: number;
}

