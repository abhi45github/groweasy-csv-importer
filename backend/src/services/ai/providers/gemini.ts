import {
  CompletionInput,
  LlmError,
  LlmProvider,
  fetchWithTimeout,
  isRetryableStatus,
} from './types';

/**
 * Google Gemini provider via the Generative Language REST API.
 * Uses `responseMimeType: application/json` to force well-formed JSON output.
 */
export function createGeminiProvider(apiKey: string, model: string): LlmProvider {
  return {
    name: 'gemini',
    model,
    async complete({ system, user }: CompletionInput): Promise<string> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      };

      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await safeText(res);
        throw new LlmError(
          `Gemini request failed (${res.status}): ${detail}`,
          res.status,
          isRetryableStatus(res.status),
        );
      }

      const json = (await res.json()) as GeminiResponse;
      const text = json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('');

      if (!text) {
        const finish = json.candidates?.[0]?.finishReason;
        throw new LlmError(
          `Gemini returned an empty response${finish ? ` (finishReason: ${finish})` : ''}.`,
          undefined,
          true,
        );
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

interface GeminiResponse {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
}
