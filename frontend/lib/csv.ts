import Papa from 'papaparse';
import type { CrmField, ExtractedRecord } from './types';

export interface ParsedPreview {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

/**
 * Parse a CSV string for the client-side PREVIEW table only. The authoritative
 * parse happens on the backend; here we just need to show the user their data.
 */
export function parseCsvClient(text: string): ParsedPreview {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const result = Papa.parse<string[]>(clean, {
    skipEmptyLines: 'greedy',
  });

  const grid = (result.data as string[][]).filter(
    (r) => Array.isArray(r) && r.some((c) => (c ?? '').trim() !== ''),
  );

  if (grid.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const headers = grid[0].map((h, i) => (h ?? '').trim() || `Column ${i + 1}`);
  const rows = grid.slice(1).map((r) => headers.map((_, i) => (r[i] ?? '').toString()));
  return { headers, rows, rowCount: rows.length };
}

/** Serialise extracted CRM records into a CSV string matching the CRM schema. */
export function recordsToCsv(
  records: ExtractedRecord[],
  fields: readonly CrmField[],
): string {
  const rows = records.map((rec) =>
    fields.map((f) => (rec[f] ?? '').toString()),
  );
  return Papa.unparse({ fields: fields as unknown as string[], data: rows });
}

/** Pretty JSON export of the CRM records (without internal rowNumber). */
export function recordsToJson(records: ExtractedRecord[]): string {
  const clean = records.map(({ rowNumber, ...rest }) => rest);
  return JSON.stringify(clean, null, 2);
}
