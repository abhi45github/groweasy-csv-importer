import { env } from '../config/env';

/**
 * Tiny structured logger — zero dependencies, JSON in production for log
 * aggregators, pretty & colourised in development.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const COLORS: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  if (env.isProduction) {
    process.stdout.write(
      JSON.stringify({ level, timestamp, message, ...meta }) + '\n',
    );
    return;
  }
  const color = COLORS[level];
  const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  process.stdout.write(
    `${color}${level.toUpperCase().padEnd(5)}${RESET} ${timestamp} ${message}${metaStr}\n`,
  );
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => emit('debug', m, meta),
  info: (m: string, meta?: Record<string, unknown>) => emit('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit('error', m, meta),
};
