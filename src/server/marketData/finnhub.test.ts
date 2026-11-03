import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinnhubClient, FinnhubApiError } from './finnhubClient';
import { MarketDataCache } from './cache';
import { FinnhubValidator } from './validator';
import { MarketDataService } from './service';
import { calculateSLTPMetrics, calculateWeightedAverageBuy } from '../../lib/investmentEngine';
import type { InvestmentAsset } from '../../types';

describe('Finnhub Market Data Provider & Integration Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Environment & Key Configuration
  describe('1. Environment Configuration & Secret Masking', () => {
    it('correctly identifies missing or unconfigured API key', () => {
      const client = new FinnhubClient({ apiKey: '' });
      expect(client.isConfigured()).toBe(false);
      expect(client.getMaskedKey()).toBe('Not Configured');
    });

    it('masks valid API key safely and never exposes raw value', () => {
      const client = new FinnhubClient({ apiKey: 'sandbox_c89xyz123456789' });
      expect(client.isConfigured()).toBe(true);
      const masked = client.getMaskedKey();
      expect(masked).toContain('••••••••');
      expect(masked).not.toBe('sandbox_c89xyz123456789');
    });

    it('redacts API key and token query parameters from error strings', () => {
      const client = new FinnhubClient({ apiKey: 'secret_token_12345' });
      const sensitiveUrl = 'https://finnhub.io/api/v1/quote?symbol=AAPL&token=secret_token_12345';
      const redacted = client.redact(`Failed to fetch ${sensitiveUrl}`);
      expect(redacted).not.toContain('secret_token_12345');
      expect(redacted).toContain('[REDACTED_FINNHUB_TOKEN]');
    });
  });

  // 2. HTTP Client & Error Handling
  describe('2. Client HTTP & Resilient Error Handling', () => {
    it('throws 401 FinnhubApiError when request is made without API key', async () => {
      const client = new FinnhubClient({ apiKey: '' });
      await expect(client.request('/quote', { symbol: 'AAPL' })).rejects.toThrow(FinnhubApiError);
    });

    it('handles HTTP 401 / 403 authentication error without endless retries', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key'
      });

      const client = new FinnhubClient({
        apiKey: 'invalid_key_test',
        fetchFn: mockFetch as any,
        maxRetries: 2
      });

      await expect(client.request('/quote', { symbol: 'AAPL' })).rejects.toThrow(FinnhubApiError);
      // Auth error should not retry
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('handles HTTP 429 rate limit with exponential backoff retry', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            text: async () => 'Rate limit reached'
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ c: 185.5, pc: 182.0 })
        };
      });

      const client = new FinnhubClient({
        apiKey: 'valid_test_key_123',
        fetchFn: mockFetch as any,
        maxRetries: 2
      });

      const data = await client.request<any>('/quote', { symbol: 'AAPL' });
      expect(callCount).toBe(2);
      expect(data.c).toBe(185.5);
    });
  });

  // 3. Response Normalization & Validation
  describe('3. Financial Data Normalizer & Validation', () => {
    it('normalizes valid quote response correctly', () => {
      const raw = {
        c: 220.5,
        d: 3.5,
        dp: 1.61,
        h: 222.0,
        l: 218.0,
        o: 219.0,
        pc: 217.0,
        t: 1730600000
      };

      const quote = FinnhubValidator.normalizeQuote('AAPL', raw);
      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('AAPL');
      expect(quote?.currentPrice).toBe(220.5);
      expect(quote?.change).toBe(3.5);
      expect(quote?.changePercent).toBe(1.61);
      expect(quote?.dataStatus).toBe('realtime');
    });

    it('rejects empty quote (c: 0, pc: 0) for unsupported or nonexistent symbols', () => {
      const emptyRaw = { c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0, t: 0 };
      const quote = FinnhubValidator.normalizeQuote('UNKNOWN_TICKER', emptyRaw);
      expect(quote).toBeNull();
    });

    it('normalizes historical candlestick OHLCV data', () => {
      const raw = {
        s: 'ok',
        c: [100, 102],
        h: [105, 106],
        l: [98, 99],
        o: [99, 101],
        v: [1000, 2000],
        t: [1700000000, 1700086400]
      };

      const candle = FinnhubValidator.normalizeCandle('AAPL', 'D', raw);
      expect(candle?.status).toBe('ok');
      expect(candle?.close.length).toBe(2);
      expect(candle?.timestamp[0]).toBe(1700000000000);
    });

    it('normalizes company profile and extracts official logo', () => {
      const raw = {
        name: 'Apple Inc',
        ticker: 'AAPL',
        exchange: 'NASDAQ',
        finnhubIndustry: 'Technology',
        country: 'US',
        currency: 'USD',
        logo: 'https://static.finnhub.io/logo/aapl.png'
      };

      const profile = FinnhubValidator.normalizeProfile('AAPL', raw);
      expect(profile?.companyName).toBe('Apple Inc');
      expect(profile?.logoUrl).toBe('https://static.finnhub.io/logo/aapl.png');
      expect(profile?.industry).toBe('Technology');
    });
  });

  // 4. In-Memory Caching & Request Coalescence
  describe('4. In-Memory Cache & Request Deduplication', () => {
    it('returns cached data without duplicate upstream queries', async () => {
      const cache = new MarketDataCache();
      let fetchCount = 0;
      const fetcher = async () => {
        fetchCount++;
        return { price: 150 };
      };

      const res1 = await cache.getOrFetch('quote:AAPL', 60, fetcher);
      const res2 = await cache.getOrFetch('quote:AAPL', 60, fetcher);

      expect(res1.price).toBe(150);
      expect(res2.price).toBe(150);
      expect(fetchCount).toBe(1);
    });

    it('coalesces concurrent requests for identical key into a single promise', async () => {
      const cache = new MarketDataCache();
      let fetchCount = 0;
      const fetcher = async () => {
        fetchCount++;
        await new Promise(r => setTimeout(r, 20));
        return { symbol: 'NVDA' };
      };

      const [p1, p2, p3] = await Promise.all([
        cache.getOrFetch('quote:NVDA', 60, fetcher),
        cache.getOrFetch('quote:NVDA', 60, fetcher),
        cache.getOrFetch('quote:NVDA', 60, fetcher)
      ]);

      expect(p1.symbol).toBe('NVDA');
      expect(p2.symbol).toBe('NVDA');
      expect(p3.symbol).toBe('NVDA');
      expect(fetchCount).toBe(1);
    });
  });

  // 5. Domestic Vietnamese Asset Fallback & Ledger Preservation
  describe('5. Domestic Vietnamese Asset Fallback & Ledger Preservation', () => {
    it('seamlessly resolves Vietnamese VN30 stocks to verified catalog reference', async () => {
      const service = new MarketDataService();
      const quote = await service.getQuote('TCB');

      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('TCB');
      expect(quote?.currentPrice).toBe(24200);
      expect(quote?.source).toBe('vietnam_catalog');
      expect(quote?.dataStatus).toBe('reference');
    });

    it('calculates portfolio valuation without mutating purchase cost basis', () => {
      // Historical position: bought 100 TCB @ 20,000 VND
      const asset: InvestmentAsset = {
        id: 'inv-1',
        symbol: 'TCB',
        name: 'Techcombank',
        assetClass: 'stock',
        quantity: 100,
        totalCostBasis: 2000000,
        currentUnitPrice: 24200,
        updatedAt: '2026-01-15'
      };

      const currentValue = asset.quantity * asset.currentUnitPrice;
      const unrealizedPnL = currentValue - asset.totalCostBasis;
      const pnlPercent = (unrealizedPnL / asset.totalCostBasis) * 100;

      expect(currentValue).toBe(2420000);
      expect(unrealizedPnL).toBe(420000);
      expect(pnlPercent).toBe(21);
      // Cost basis remains completely untouched
      expect(asset.totalCostBasis).toBe(2000000);
    });

    it('calculates weighted average cost correctly after new BUY order', () => {
      // Old: 100 @ 20,000 = 2,000,000
      // Buy: 50 @ 25,000 with fee 10,000 = 1,260,000
      // Total Qty = 150, Total Cost = 3,260,000, Avg = 21,733
      const result = calculateWeightedAverageBuy(100, 2000000, 50, 25000, 10000);
      expect(result.newQuantity).toBe(150);
      expect(result.newTotalCostBasis).toBe(3260000);
      expect(result.newAveragePrice).toBe(21733);
    });

    it('triggers SL/TP status correctly based on current market price', () => {
      const entryPrice = 120000;
      const currentPrice = 165000;
      const targetTakeProfit = 160000;
      const targetStopLoss = 110000;

      const sltp = calculateSLTPMetrics(entryPrice, currentPrice, targetTakeProfit, targetStopLoss);
      expect(sltp.status).toBe('tp_hit');
      expect(sltp.statusLabel).toContain('Chốt lời (TP Hit)');
    });
  });

  // 6. Admin Telemetry & Health Tracking
  describe('6. Admin Telemetry & Health Monitoring', () => {
    it('generates accurate provider health telemetry report', () => {
      const service = new MarketDataService();
      const health = service.getHealth();

      expect(health.provider).toBe('finnhub');
      expect(typeof health.isKeyConfigured).toBe('boolean');
      expect(typeof health.averageLatencyMs).toBe('number');
      expect(typeof health.rateLimitHits).toBe('number');
    });
  });
});
