import {
  CompletionInput,
  LlmError,
  LlmProvider,
  fetchWithTimeout,
  isRetryableStatus,
} from './types';

/**
 * Anthropic Claude provider via the Messages API.
 *
 * Claude has no explicit JSON mode, so we prefill the assistant turn with "{"
 * to force the model to continue a JSON object, then re-prepend it on the way
 * out. Combined with a strict system prompt this yields reliable JSON.
 */
export function createAnthropicProvider(apiKey: string, model: string): LlmProvider {
  return {
    name: 'anthropic',
    model,
    async complete({ system, user }: CompletionInput): Promise<string> {
      const body = {
        model,
        max_tokens: 8192,
        temperature: 0,
        system,
        messages: [
          { role: 'user', content: user },
          { role: 'assistant', content: '{' },
        ],
      };

      const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await safeText(res);
        throw new LlmError(
          `Anthropic request failed (${res.status}): ${detail}`,
          res.status,
          isRetryableStatus(res.status),
        );
      }

      const json = (await res.json()) as AnthropicResponse;
      const text = json.content
        ?.map((c) => (c.type === 'text' ? c.text : ''))
        .join('');
      if (!text) {
        throw new LlmError('Anthropic returned an empty response.', undefined, true);
      }
      // Re-prepend the prefill so the caller receives a complete JSON object.
      return `{${text}`;
    },
  };
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '<no body>';
  }
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}
