import type { IncomingMessage, ServerResponse } from 'http';
import { marketDataService } from './marketData/service';
import { VERIFIED_VN_MARKET_CATALOG } from '../lib/vietnamMarketService';

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function handleMarketApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = parsedUrl.pathname;

  if (!pathname.startsWith('/api/market')) {
    return false;
  }

  try {
    // 1. GET /api/market/health
    if (pathname === '/api/market/health' && req.method === 'GET') {
      const health = marketDataService.getHealth();
      sendJson(res, 200, { success: true, data: health });
      return true;
    }

    // 2. POST /api/market/test-connection
    if (pathname === '/api/market/test-connection' && (req.method === 'POST' || req.method === 'GET')) {
      const result = await marketDataService.testConnection();
      sendJson(res, result.success ? 200 : 400, result);
      return true;
    }

    // 3. GET /api/market/search?q=
    if (pathname === '/api/market/search' && req.method === 'GET') {
      const q = parsedUrl.searchParams.get('q') || '';
      const results = await marketDataService.search(q);
      sendJson(res, 200, { success: true, data: results });
      return true;
    }

    // 4. GET /api/market/symbols
    if (pathname === '/api/market/symbols' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        data: VERIFIED_VN_MARKET_CATALOG
      });
      return true;
    }

    // 5. GET /api/market/quote/:symbol
    if (pathname.startsWith('/api/market/quote/') && req.method === 'GET') {
      const symbol = pathname.replace('/api/market/quote/', '').trim();
      const quote = await marketDataService.getQuote(symbol);

      if (!quote) {
        sendJson(res, 404, {
          success: false,
          error: `No quote data available for symbol ${symbol}`,
          symbol
        });
        return true;
      }

      sendJson(res, 200, { success: true, data: quote });
      return true;
    }

    // 6. GET /api/market/candles/:symbol
    if (pathname.startsWith('/api/market/candles/') && req.method === 'GET') {
      const symbol = pathname.replace('/api/market/candles/', '').trim();
      const resolution = parsedUrl.searchParams.get('resolution') || 'D';
      const to = Number(parsedUrl.searchParams.get('to') || Math.floor(Date.now() / 1000));
      const from = Number(parsedUrl.searchParams.get('from') || (to - 30 * 86400));

      const candles = await marketDataService.getCandles(symbol, resolution, from, to);
      sendJson(res, 200, { success: true, data: candles });
      return true;
    }

    // 7. GET /api/market/profile/:symbol
    if (pathname.startsWith('/api/market/profile/') && req.method === 'GET') {
      const symbol = pathname.replace('/api/market/profile/', '').trim();
      const profile = await marketDataService.getProfile(symbol);

      if (!profile) {
        sendJson(res, 404, {
          success: false,
          error: `Company profile not found for symbol ${symbol}`,
          symbol
        });
        return true;
      }

      sendJson(res, 200, { success: true, data: profile });
      return true;
    }

    // 8. GET /api/market/status?exchange=
    if (pathname === '/api/market/status' && req.method === 'GET') {
      const exchange = parsedUrl.searchParams.get('exchange') || 'US';
      const status = await marketDataService.getMarketStatus(exchange);
      sendJson(res, 200, { success: true, data: status });
      return true;
    }

    sendJson(res, 404, { success: false, error: 'Endpoint not found' });
    return true;
  } catch (err: any) {
    sendJson(res, 500, {
      success: false,
      error: 'Internal market API service error'
    });
    return true;
  }
}

