import {
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  CrmStatus,
  DataSource,
  ExtractedRecord,
  SkippedRecord,
} from '../../types/crm';
import type { CrmRecordInput } from './schema';

/**
 * Deterministic normalisation & validation of a single AI-produced record.
 *
 * The LLM does the *intelligent mapping*; this layer enforces the assignment's
 * hard rules so the output is trustworthy regardless of what the model returns:
 *   - closed value sets for crm_status / data_source
 *   - a single primary email & mobile, with extras folded into crm_note
 *   - JS-parseable created_at
 *   - CSV-safe values (no stray line breaks)
 *   - skip rows that have neither an email nor a mobile number
 */

const EMAIL_RE = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi;
const STATUS_SET = new Set<string>(CRM_STATUS_VALUES);
const SOURCE_SET = new Set<string>(DATA_SOURCE_VALUES);

/** Trim and make a value safe to live inside a single CSV cell / JSON string. */
function sanitize(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    // Collapse any real line break into the literal two-char sequence "\n"
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/\t/g, ' ')
    .trim();
}

function coerceStatus(value: unknown): CrmStatus | '' {
  const v = sanitize(value).toUpperCase();
  return STATUS_SET.has(v) ? (v as CrmStatus) : '';
}

function coerceSource(value: unknown): DataSource | '' {
  const v = sanitize(value).toLowerCase();
  return SOURCE_SET.has(v) ? (v as DataSource) : '';
}

/** Pull the first valid email out of a field that may contain several. */
function extractEmails(value: unknown): { primary: string; extras: string[] } {
  const matches = sanitize(value).match(EMAIL_RE) ?? [];
  const unique = [...new Set(matches.map((m) => m.toLowerCase()))];
  const [primary = '', ...extras] = unique;
  return { primary, extras };
}

/** Keep the numeric part of a country code, prefixed with "+". */
function cleanCountryCode(value: unknown): string {
  const digits = sanitize(value).replace(/[^\d]/g, '');
  return digits ? `+${digits}` : '';
}

/**
 * Extract mobile number(s). Returns the primary (digits only, no country code)
 * plus any additional numbers found in the same field.
 */
function extractMobiles(value: unknown): { primary: string; extras: string[] } {
  const raw = sanitize(value);
  if (!raw) return { primary: '', extras: [] };

  // Split on separators that reliably indicate distinct numbers.
  const candidates = raw
    .split(/[;,/|]|\bor\b|\band\b|\\n/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  const cleaned = candidates
    .map((c) => c.replace(/[^\d]/g, ''))
    .filter((c) => c.length >= 6 && c.length <= 15);

  const unique = [...new Set(cleaned)];
  const [primary = '', ...extras] = unique;
  return { primary, extras };
}

/**
 * Strip a leading country code from a bare mobile number when it is clearly
 * present (e.g. "919876543210" → "9876543210" for a +91 code).
 */
function stripCountryCode(mobile: string, countryCode: string): string {
  const cc = countryCode.replace(/[^\d]/g, '');
  if (cc && mobile.startsWith(cc) && mobile.length - cc.length >= 6) {
    return mobile.slice(cc.length);
  }
  return mobile;
}

function isParseableDate(value: string): boolean {
  if (!value) return false;
  const t = new Date(value).getTime();
  return !Number.isNaN(t);
}

function rawRowIsEmpty(raw: Record<string, string>): boolean {
  return Object.values(raw).every((v) => !v || v.trim() === '');
}

export interface NormalizeResult {
  ok: ExtractedRecord | null;
  skipped: SkippedRecord | null;
}

export function normalizeRecord(
  input: CrmRecordInput,
  raw: Record<string, string>,
  rowNumber: number,
): NormalizeResult {
  if (rawRowIsEmpty(raw)) {
    return {
      ok: null,
      skipped: {
        rowNumber,
        reason: 'empty_row',
        message: 'Row is empty.',
        raw,
      },
    };
  }

  const noteParts: string[] = [];
  const pushNote = (label: string, items: string[]) => {
    if (items.length) noteParts.push(`${label}: ${items.join(', ')}`);
  };

  // ── Email ────────────────────────────────────────────────
  const { primary: email, extras: extraEmails } = extractEmails(input.email);
  pushNote('Additional emails', extraEmails);

  // ── Mobile / country code ────────────────────────────────
  // Prefer an explicit country_code; otherwise sniff a "+CC " prefix off the
  // number itself (common in exports, e.g. "+91 98765 43210").
  let countryCode = cleanCountryCode(input.country_code);
  const rawMobileField = sanitize(input.mobile_without_country_code);
  if (!countryCode) {
    const sniff = rawMobileField.match(/^\s*\+(\d{1,4})[\s\-.]/);
    if (sniff) countryCode = `+${sniff[1]}`;
  }
  const { primary: mobileRaw, extras: extraMobiles } = extractMobiles(rawMobileField);
  const mobile = stripCountryCode(mobileRaw, countryCode);
  pushNote('Additional phones', extraMobiles);

  // ── created_at ───────────────────────────────────────────
  const createdAt = sanitize(input.created_at);
  const safeCreatedAt = isParseableDate(createdAt) ? createdAt : '';

  // ── Assemble crm_note (model note first, then folded extras) ──
  const baseNote = sanitize(input.crm_note);
  const combinedNote = [baseNote, ...noteParts].filter(Boolean).join(' | ');

  const record: ExtractedRecord = {
    rowNumber,
    created_at: safeCreatedAt,
    name: sanitize(input.name),
    email,
    country_code: email || mobile ? countryCode : '',
    mobile_without_country_code: mobile,
    company: sanitize(input.company),
    city: sanitize(input.city),
    state: sanitize(input.state),
    country: sanitize(input.country),
    lead_owner: sanitize(input.lead_owner),
    crm_status: coerceStatus(input.crm_status),
    crm_note: combinedNote,
    data_source: coerceSource(input.data_source),
    possession_time: sanitize(input.possession_time),
    description: sanitize(input.description),
  };

  // ── Skip rule: must have at least one of email / mobile ───
  if (!record.email && !record.mobile_without_country_code) {
    return {
      ok: null,
      skipped: {
        rowNumber,
        reason: 'missing_email_and_mobile',
        message: 'No email or mobile number could be extracted from this row.',
        raw,
      },
    };
  }

  return { ok: record, skipped: null };
}
