import type { Plugin } from 'vite';
import './envLoader';
import { handleMarketApiRequest } from './marketApiHandler';

export function viteMarketApiPlugin(): Plugin {
  return {
    name: 'finora-market-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleMarketApiRequest(req, res);
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
          const handled = await handleMarketApiRequest(req, res);
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

