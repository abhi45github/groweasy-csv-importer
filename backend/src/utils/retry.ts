/**
 * Retry an async operation with exponential backoff and jitter.
 *
 * Used to make LLM calls resilient to transient rate-limits / network blips.
 */

export interface RetryOptions {
  retries: number;
  /** Base delay in ms; doubles each attempt. */
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Return false to stop retrying a particular error. */
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const {
    retries,
    baseDelayMs = 500,
    maxDelayMs = 8000,
    shouldRetry = () => true,
    onRetry,
  } = opts;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const isLast = attempt === retries + 1;
      if (isLast || !shouldRetry(error)) break;

      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.floor(Math.random() * (backoff / 2));
      const delayMs = backoff + jitter;
      onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}
