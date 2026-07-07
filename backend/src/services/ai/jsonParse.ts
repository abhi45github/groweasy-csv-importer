/**
 * Robustly pull a JSON object out of an LLM response.
 *
 * Even with JSON-mode enabled, models occasionally wrap output in markdown
 * fences or add stray characters. This tries progressively more forgiving
 * strategies before giving up.
 */
export function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();

  // 1) Straight parse.
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  // 2) Strip ```json ... ``` / ``` ... ``` fences.
  const fenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (fenced !== trimmed) {
    try {
      return JSON.parse(fenced);
    } catch {
      /* fall through */
    }
  }

  // 3) Slice from the first "{" to the last "}".
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const slice = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch {
      /* fall through */
    }
  }

  throw new Error('Model response was not valid JSON.');
}
