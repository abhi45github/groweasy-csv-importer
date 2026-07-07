import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, validated runtime configuration.
 *
 * Everything the app needs from the environment is read exactly once here and
 * exposed as a typed, frozen object. This keeps `process.env` access out of the
 * rest of the codebase and makes misconfiguration fail loudly & early.
 */

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function str(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

const AI_PROVIDER = str(process.env.AI_PROVIDER, 'auto').toLowerCase();

export const env = Object.freeze({
  nodeEnv: str(process.env.NODE_ENV, 'development'),
  isProduction: str(process.env.NODE_ENV, 'development') === 'production',
  port: num(process.env.PORT, 4000),

  /** Comma-separated allow-list, or "*" for any origin. */
  corsOrigin: str(process.env.CORS_ORIGIN, '*'),

  ai: {
    provider: AI_PROVIDER as 'auto' | 'gemini' | 'openai' | 'anthropic',
    gemini: {
      apiKey: str(process.env.GEMINI_API_KEY, ''),
      model: str(process.env.GEMINI_MODEL, 'gemini-2.5-flash'),
    },
    openai: {
      apiKey: str(process.env.OPENAI_API_KEY, ''),
      model: str(process.env.OPENAI_MODEL, 'gpt-4o-mini'),
    },
    anthropic: {
      apiKey: str(process.env.ANTHROPIC_API_KEY, ''),
      model: str(process.env.ANTHROPIC_MODEL, 'claude-3-5-haiku-latest'),
    },
  },

  extraction: {
    batchSize: num(process.env.AI_BATCH_SIZE, 25),
    concurrency: num(process.env.AI_CONCURRENCY, 3),
    maxRetries: num(process.env.AI_MAX_RETRIES, 3),
    maxRows: num(process.env.MAX_ROWS, 5000),
    maxUploadMb: num(process.env.MAX_UPLOAD_MB, 10),
  },
});

export type Env = typeof env;
