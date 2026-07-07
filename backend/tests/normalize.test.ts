import { describe, it, expect } from 'vitest';
import { normalizeRecord } from '../src/services/crm/normalize';

const raw = (over: Record<string, string> = {}) => ({ any: 'value', ...over });

describe('normalizeRecord', () => {
  it('keeps a record that has an email', () => {
    const { ok, skipped } = normalizeRecord({ email: 'a@x.com', name: 'A' }, raw(), 1);
    expect(skipped).toBeNull();
    expect(ok?.email).toBe('a@x.com');
    expect(ok?.rowNumber).toBe(1);
  });

  it('skips a record with neither email nor mobile', () => {
    const { ok, skipped } = normalizeRecord({ name: 'No Contact' }, raw(), 3);
    expect(ok).toBeNull();
    expect(skipped?.reason).toBe('missing_email_and_mobile');
    expect(skipped?.rowNumber).toBe(3);
  });

  it('skips an entirely empty source row', () => {
    const { skipped } = normalizeRecord({}, { a: '', b: '  ' }, 2);
    expect(skipped?.reason).toBe('empty_row');
  });

  it('uses the first email and folds extras into crm_note', () => {
    const { ok } = normalizeRecord(
      { email: 'first@x.com, second@y.com', mobile_without_country_code: '9876543210' },
      raw(),
      1,
    );
    expect(ok?.email).toBe('first@x.com');
    expect(ok?.crm_note).toContain('second@y.com');
  });

  it('splits a "+CC " prefix from the mobile number', () => {
    const { ok } = normalizeRecord(
      { mobile_without_country_code: '+91 98765 43210' },
      raw(),
      1,
    );
    expect(ok?.country_code).toBe('+91');
    expect(ok?.mobile_without_country_code).toBe('9876543210');
  });

  it('strips a country code that is already embedded in the number', () => {
    const { ok } = normalizeRecord(
      { country_code: '+91', mobile_without_country_code: '919876543210' },
      raw(),
      1,
    );
    expect(ok?.mobile_without_country_code).toBe('9876543210');
  });

  it('folds additional phone numbers into crm_note', () => {
    const { ok } = normalizeRecord(
      { mobile_without_country_code: '9876500011 / 9876500022' },
      raw(),
      1,
    );
    expect(ok?.mobile_without_country_code).toBe('9876500011');
    expect(ok?.crm_note).toContain('9876500022');
  });

  it('coerces an out-of-set status/source to empty', () => {
    const { ok } = normalizeRecord(
      { email: 'a@x.com', crm_status: 'MAYBE', data_source: 'facebook' },
      raw(),
      1,
    );
    expect(ok?.crm_status).toBe('');
    expect(ok?.data_source).toBe('');
  });

  it('preserves valid status/source values (case-insensitively)', () => {
    const { ok } = normalizeRecord(
      { email: 'a@x.com', crm_status: 'sale_done', data_source: 'EDEN_PARK' },
      raw(),
      1,
    );
    expect(ok?.crm_status).toBe('SALE_DONE');
    expect(ok?.data_source).toBe('eden_park');
  });

  it('blanks an unparseable created_at but keeps a valid one', () => {
    const bad = normalizeRecord({ email: 'a@x.com', created_at: 'not-a-date' }, raw(), 1);
    expect(bad.ok?.created_at).toBe('');
    const good = normalizeRecord(
      { email: 'a@x.com', created_at: '2026-05-13 14:20:48' },
      raw(),
      1,
    );
    expect(good.ok?.created_at).toBe('2026-05-13 14:20:48');
    expect(Number.isNaN(new Date(good.ok!.created_at!).getTime())).toBe(false);
  });

  it('escapes newlines to keep values CSV-safe', () => {
    const { ok } = normalizeRecord(
      { email: 'a@x.com', crm_note: 'line1\nline2\r\nline3' },
      raw(),
      1,
    );
    expect(ok?.crm_note).not.toContain('\n');
    expect(ok?.crm_note).toContain('\\n');
  });
});
