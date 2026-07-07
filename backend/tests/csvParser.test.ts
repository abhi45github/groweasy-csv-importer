import { describe, it, expect } from 'vitest';
import { parseCsv } from '../src/services/csv/csvParser';

describe('parseCsv', () => {
  it('parses a simple CSV into keyed rows', () => {
    const csv = 'name,email\nJohn,john@x.com\nJane,jane@x.com';
    const result = parseCsv(csv, 1000);
    expect(result.headers).toEqual(['name', 'email']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: 'John', email: 'john@x.com' });
    expect(result.totalRows).toBe(2);
    expect(result.truncated).toBe(false);
  });

  it('handles quoted fields containing commas and newlines', () => {
    const csv = 'name,note\n"Doe, John","line1\nline2"';
    const result = parseCsv(csv, 1000);
    expect(result.rows[0].name).toBe('Doe, John');
    expect(result.rows[0].note).toBe('line1\nline2');
  });

  it('strips a UTF-8 BOM from the first header', () => {
    const csv = '﻿name,email\nJohn,john@x.com';
    const result = parseCsv(csv, 1000);
    expect(result.headers[0]).toBe('name');
  });

  it('de-duplicates repeated headers', () => {
    const csv = 'email,email\na@x.com,b@x.com';
    const result = parseCsv(csv, 1000);
    expect(result.headers).toEqual(['email', 'email_1']);
    expect(result.rows[0]).toEqual({ email: 'a@x.com', email_1: 'b@x.com' });
  });

  it('names blank headers column_N', () => {
    const csv = 'name,,city\nJohn,x,Pune';
    const result = parseCsv(csv, 1000);
    expect(result.headers).toEqual(['name', 'column_2', 'city']);
  });

  it('truncates to maxRows and flags truncation', () => {
    const csv = 'n\n1\n2\n3\n4\n5';
    const result = parseCsv(csv, 3);
    expect(result.rows).toHaveLength(3);
    expect(result.totalRows).toBe(5);
    expect(result.truncated).toBe(true);
  });

  it('throws on an empty file', () => {
    expect(() => parseCsv('   ', 1000)).toThrow();
  });
});
