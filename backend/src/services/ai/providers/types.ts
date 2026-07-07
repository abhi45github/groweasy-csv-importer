/** A minimal, provider-agnostic contract for a JSON-returning LLM call. */
export interface LlmProvider {
  /** Stable identifier, e.g. "gemini" / "openai" / "anthropic". */
  readonly name: string;
  /** The concrete model in use, surfaced for logs & the UI. */
  readonly model: string;
  /**
   * Send a system + user prompt and return the raw text response
   * (expected, but not guaranteed, to be JSON).
   */
  complete(input: CompletionInput): Promise<string>;
}

export interface CompletionInput {
  system: string;
  user: string;
  signal?: AbortSignal;
}

export class LlmError extends Error {
  readonly status?: number;
  readonly retryable: boolean;

  constructor(message: string, status?: number, retryable = true) {
    super(message);
    this.name = 'LlmError';
    this.status = status;
    this.retryable = retryable;
  }
}

/** Providers should treat 429 + 5xx (and network errors) as retryable. */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/** Fetch with an abortable timeout. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 60_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
