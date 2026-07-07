import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { createAnthropicProvider } from './anthropic';
import { createGeminiProvider } from './gemini';
import { createOpenAiProvider } from './openai';
import { LlmProvider } from './types';

export type { LlmProvider } from './types';

/**
 * Resolve which LLM provider to use, based on `AI_PROVIDER` and whichever API
 * keys are configured. Returns `null` when no provider is available — the
 * extractor then falls back to a deterministic heuristic mapper so the product
 * still works end-to-end without any key.
 */
export function resolveProvider(): LlmProvider | null {
  const { provider, gemini, openai, anthropic } = env.ai;

  const builders: Record<string, () => LlmProvider | null> = {
    gemini: () =>
      gemini.apiKey ? createGeminiProvider(gemini.apiKey, gemini.model) : null,
    openai: () =>
      openai.apiKey ? createOpenAiProvider(openai.apiKey, openai.model) : null,
    anthropic: () =>
      anthropic.apiKey
        ? createAnthropicProvider(anthropic.apiKey, anthropic.model)
        : null,
  };

  // Explicit provider requested.
  if (provider !== 'auto') {
    const built = builders[provider]?.();
    if (built) {
      logger.info(`AI provider: ${built.name}`, { model: built.model });
      return built;
    }
    logger.warn(
      `AI_PROVIDER="${provider}" but no matching API key found — trying auto-detect.`,
    );
  }

  // Auto-detect: first available wins, in preference order.
  for (const name of ['gemini', 'openai', 'anthropic'] as const) {
    const built = builders[name]();
    if (built) {
      logger.info(`AI provider (auto): ${built.name}`, { model: built.model });
      return built;
    }
  }

  logger.warn(
    'No LLM API key configured — using deterministic heuristic mapper as fallback.',
  );
  return null;
}
