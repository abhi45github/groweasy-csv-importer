import Papa from 'papaparse';
import { AppError } from '../../utils/errors';

export interface ParsedCsv {
  headers: string[];
  /** Each row keyed by (de-duplicated, trimmed) header name. */
  rows: Record<string, string>[];
  /** Rows detected in the file, before any row-cap truncation. */
  totalRows: number;
  truncated: boolean;
}

/**
 * Parse an arbitrary CSV string into structured rows.
 *
 * We do NOT assume anything about column names — the whole point of the product
 * is that the AI figures the mapping out later. Here we only care about turning
 * bytes into clean rows: handling quoting, embedded commas/newlines, BOMs,
 * ragged rows and duplicate headers robustly.
 */
export function parseCsv(input: string, maxRows: number): ParsedCsv {
  const text = stripBom(input);

  if (!text.trim()) {
    throw AppError.badRequest('The uploaded file is empty.');
  }

  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const grid = (result.data as unknown as string[][]).filter(
    (r) => Array.isArray(r) && r.length > 0,
  );

  if (grid.length === 0) {
    throw AppError.badRequest('No rows could be parsed from the file.');
  }

  const rawHeaders = grid[0].map((h) => (h ?? '').toString().trim());
  const headers = dedupeHeaders(rawHeaders);

  if (headers.every((h) => h === '')) {
    throw AppError.badRequest('The CSV has no usable header row.');
  }

  const dataRows = grid.slice(1);
  const totalRows = dataRows.length;
  const truncated = totalRows > maxRows;
  const limited = truncated ? dataRows.slice(0, maxRows) : dataRows;

  const rows: Record<string, string>[] = limited.map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((key, i) => {
      row[key] = (cells[i] ?? '').toString().trim();
    });
    return row;
  });

  return { headers, rows, totalRows, truncated };
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Guarantee unique, non-empty header keys so rows can be safely keyed by header.
 * Blank headers become `column_N`; collisions get a numeric suffix.
 */
function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((raw, i) => {
    let key = raw && raw.trim() ? raw.trim() : `column_${i + 1}`;
    if (seen.has(key)) {
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      key = `${key}_${count}`;
    } else {
      seen.set(key, 0);
    }
    return key;
  });
}
