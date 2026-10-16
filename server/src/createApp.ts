import * as path from 'path';

import express, { Express } from 'express';

import { createAuthRouter } from './auth/neonAuth.routes';
import { getRoutes } from './routes';
import { errorHandler, sendResponse } from './utils/response';

export type AppOptions = {
  clientDir?: string;
  ensureDatabase?: () => Promise<void>;
};

export const createApp = ({ clientDir, ensureDatabase }: AppOptions = {}): Express => {
  const app = express();

  // Before the JSON parser and the database check: the proxy forwards raw bodies to Neon Auth.
  app.use(createAuthRouter());

  if (ensureDatabase) {
    app.use('/api', (_req, _res, next) => {
      ensureDatabase().then(() => next(), next);
    });
  }

  app.use(express.json());
  app.use(getRoutes());
  app.use('/api', (_req, res) => sendResponse(res, 404, 'Not found'));

  if (clientDir) {
    app.use(express.static(clientDir));
    app.use(express.static(path.join(clientDir, 'images')));
    app.use(express.static(path.join(clientDir, 'static')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
};
