import {
  CompletionInput,
  LlmError,
  LlmProvider,
  fetchWithTimeout,
  isRetryableStatus,
} from './types';

/**
 * OpenAI provider via the Chat Completions API.
 * Uses `response_format: { type: 'json_object' }` for guaranteed JSON.
 */
export function createOpenAiProvider(apiKey: string, model: string): LlmProvider {
  return {
    name: 'openai',
    model,
    async complete({ system, user }: CompletionInput): Promise<string> {
      const body = {
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      };

      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await safeText(res);
        throw new LlmError(
          `OpenAI request failed (${res.status}): ${detail}`,
          res.status,
          isRetryableStatus(res.status),
        );
      }

      const json = (await res.json()) as OpenAiResponse;
      const text = json.choices?.[0]?.message?.content;
      if (!text) {
        throw new LlmError('OpenAI returned an empty response.', undefined, true);
      }
      return text;
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

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
}
