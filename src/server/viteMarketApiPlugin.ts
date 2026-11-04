import type { Plugin } from 'vite';
import './envLoader';
import { handleUnifiedApiRequest } from './unifiedApiHandler';

export function viteMarketApiPlugin(): Plugin {
  return {
    name: 'finora-unified-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleUnifiedApiRequest(req, res);
          if (!handled) {
            next();
          }
        } catch (err) {
          next(err);
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleUnifiedApiRequest(req, res);
          if (!handled) {
            next();
          }
        } catch (err) {
          next(err);
        }
      });
    }
  };
}

