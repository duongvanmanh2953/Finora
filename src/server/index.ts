import http from 'node:http';
import './envLoader';
import { handleUnifiedApiRequest } from './unifiedApiHandler';

const PORT = Number(process.env.API_PORT || process.env.PORT || 7003);
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(async (req, res) => {
  // CORS configuration
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Refresh-Token, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Quick health check endpoint
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname === '/health' || (url.pathname === '/api/health' && req.method === 'GET')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() }));
    return;
  }

  try {
    const handled = await handleUnifiedApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: false, error: `Route not found: ${url.pathname}` }));
    }
  } catch (err: any) {
    console.error('[API Server Error]:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 Finora API Backend Server is running!`);
  console.log(`📡 URL: http://${HOST}:${PORT}`);
  console.log(`⚡ Node: ${process.version}`);
  console.log(`====================================================`);
});

const shutdown = () => {
  console.log('\nShutting down Finora API server...');
  server.close(() => {
    console.log('Server closed gracefully.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
