import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

/**
 * Build the Express application. Kept separate from the server bootstrap so it
 * can be imported directly by integration tests (supertest) without binding a
 * port.
 */
export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  const corsOrigin =
    env.corsOrigin === '*'
      ? true
      : env.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors({ origin: corsOrigin }));

  // JSON body support (for the inline { csv } path); multipart is handled per-route.
  app.use(express.json({ limit: `${env.extraction.maxUploadMb}mb` }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'GrowEasy CSV Importer API',
      version: '1.0.0',
      endpoints: ['/api/health', '/api/config', 'POST /api/import', 'POST /api/import/stream'],
    });
  });

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
