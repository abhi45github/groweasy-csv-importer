import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`GrowEasy CSV Importer API listening on http://localhost:${env.port}`, {
    env: env.nodeEnv,
  });
});

// Graceful shutdown.
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down…`);
  server.close(() => process.exit(0));
  // Force-exit if connections linger.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
