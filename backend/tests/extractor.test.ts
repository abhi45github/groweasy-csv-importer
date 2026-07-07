import { describe, it, expect } from 'vitest';
import { extractLeads } from '../src/services/ai/extractor';
import { LlmError, LlmProvider } from '../src/services/ai/providers/types';

/** Parse the rows JSON that buildUserPrompt embeds at the end of the prompt. */
function parseRows(user: string): { row: number; data: Record<string, string> }[] {
  // The data array is the block that begins on its own line ("\n["),
  // distinct from the literal "[...]" placeholder in the instructions.
  return JSON.parse(user.slice(user.indexOf('\n[')));
}

const headers = ['name', 'email', 'phone'];
const rows = [
  { name: 'Alice', email: 'alice@x.com', phone: '' },
  { name: 'Bob', email: '', phone: '9999999999' },
  { name: 'NoContact', email: '', phone: '' },
];

const successProvider: LlmProvider = {
  name: 'mock',
  model: 'mock-1',
  async complete({ user }) {
    const records = parseRows(user).map((r) => ({
      name: r.data.name ?? '',
      email: r.data.email ?? '',
      mobile_without_country_code: r.data.phone ?? '',
    }));
    return JSON.stringify({ records });
  },
};

const failingProvider: LlmProvider = {
  name: 'mock',
  model: 'mock-1',
  async complete() {
    throw new LlmError('permanent failure', 400, false);
  },
};

const countMismatchProvider: LlmProvider = {
  name: 'mock',
  model: 'mock-1',
  async complete({ user }) {
    const records = parseRows(user)
      .slice(1)
      .map((r) => ({ name: r.data.name ?? '' }));
    return JSON.stringify({ records });
  },
};

describe('extractLeads', () => {
  it('maps records via the LLM and applies skip rules', async () => {
    const result = await extractLeads({ headers, rows, provider: successProvider });
    expect(result.stats.imported).toBe(2);
    expect(result.stats.skipped).toBe(1);
    expect(result.stats.failedBatches).toBe(0);
    expect(result.provider).toEqual({ name: 'mock', model: 'mock-1', heuristic: false });
    expect(result.records.map((r) => r.name)).toEqual(['Alice', 'Bob']);
    expect(result.skipped[0].rowNumber).toBe(3);
  });

  it('preserves original row order in the output', async () => {
    const result = await extractLeads({ headers, rows, provider: successProvider });
    expect(result.records.map((r) => r.rowNumber)).toEqual([1, 2]);
  });

  it('falls back to the heuristic mapper when the LLM fails', async () => {
    const result = await extractLeads({ headers, rows, provider: failingProvider });
    expect(result.stats.failedBatches).toBe(1);
    expect(result.stats.imported).toBe(2); // Alice (email) + Bob (phone)
    expect(result.stats.skipped).toBe(1);
  });

  it('falls back when the LLM returns the wrong number of records', async () => {
    const result = await extractLeads({ headers, rows, provider: countMismatchProvider });
    expect(result.stats.failedBatches).toBe(1);
    expect(result.stats.imported).toBe(2);
  });

  it('uses pure heuristic mode when no provider is configured', async () => {
    const result = await extractLeads({ headers, rows, provider: null });
    expect(result.provider.heuristic).toBe(true);
    expect(result.stats.imported).toBe(2);
  });

  it('emits progress events', async () => {
    const events: number[] = [];
    await extractLeads({
      headers,
      rows,
      provider: successProvider,
      onProgress: (e) => events.push(e.completedBatches),
    });
    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1]).toBe(1);
  });
});
