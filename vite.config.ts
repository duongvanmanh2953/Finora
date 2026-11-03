import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteMarketApiPlugin } from './src/server/viteMarketApiPlugin';

export default defineConfig({
  plugins: [react(), viteMarketApiPlugin()],
  server: { host: '0.0.0.0' },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          charts: ['recharts', 'lucide-react']
        }
      }
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
