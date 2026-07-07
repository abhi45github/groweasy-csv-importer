import { CrmStatus, DataSource } from '../../types/crm';
import type { CrmRecordInput } from '../crm/schema';

/**
 * Deterministic, dependency-free heuristic mapper.
 *
 * This is NOT a replacement for the LLM — it's a safety net so the product still
 * produces sensible output when:
 *   - no LLM API key is configured, or
 *   - an individual AI batch permanently fails after all retries.
 *
 * It infers the CRM field for each column by fuzzy-matching header names, then
 * maps free-text status/source to the allowed value sets.
 */

const FIELD_SYNONYMS: Record<string, string[]> = {
  created_at: [
    'created at', 'created', 'created on', 'created date', 'created time',
    'date', 'datetime', 'timestamp', 'time', 'lead date', 'submitted', 'submitted on', 'enquiry date',
  ],
  name: [
    'name', 'full name', 'fullname', 'lead name', 'customer name', 'client name',
    'contact name', 'person', 'contact person',
  ],
  email: ['email', 'e mail', 'email address', 'email id', 'mail', 'emailid'],
  country_code: ['country code', 'dial code', 'isd code', 'isd', 'phone code', 'std code'],
  mobile_without_country_code: [
    'mobile', 'mobile number', 'phone', 'phone number', 'contact', 'contact number',
    'contact no', 'cell', 'cellphone', 'whatsapp', 'telephone', 'tel', 'mob', 'msisdn', 'number', 'phone no',
  ],
  company: ['company', 'company name', 'organisation', 'organization', 'firm', 'business', 'org', 'employer'],
  city: ['city', 'town', 'location'],
  state: ['state', 'province', 'region'],
  country: ['country', 'nation'],
  lead_owner: [
    'lead owner', 'owner', 'assigned to', 'assigned', 'agent', 'salesperson',
    'sales rep', 'rep', 'handled by', 'counsellor', 'counselor', 'account manager',
  ],
  crm_status: [
    'crm status', 'status', 'lead status', 'stage', 'lead stage', 'disposition',
    'call status', 'lead status',
  ],
  crm_note: [
    'crm note', 'note', 'notes', 'remark', 'remarks', 'comment', 'comments',
    'message', 'feedback', 'query',
  ],
  data_source: [
    'data source', 'source', 'lead source', 'campaign', 'project', 'channel',
    'utm source', 'platform', 'ad set', 'ad name', 'where from', 'origin', 'referred by',
  ],
  possession_time: ['possession time', 'possession', 'handover', 'possession date', 'ready to move'],
  description: ['description', 'details', 'additional description', 'about', 'info', 'additional info', 'requirement'],
};

// Leading word-boundary only (no trailing) so stems match: "interest" → "interested".
// Order matters — the first match wins, so negatives ("not interested") are
// checked before the positive "interested".
const STATUS_KEYWORDS: Array<[RegExp, CrmStatus]> = [
  [/\b(converted|convert|closed won|booked|booking|purchase|deal done|sale done|payment received|sold)/i, 'SALE_DONE'],
  [/\b(not interested|wrong number|junk|spam|do not call|dnc|invalid|cold|dead|lost|bad lead|bad|unqualified)/i, 'BAD_LEAD'],
  [/\b(no answer|not reachable|unreachable|busy|ringing|switched off|no response|voicemail|did not connect|didn'?t connect|not connected|no contact)/i, 'DID_NOT_CONNECT'],
  [/\b(interested|interest|warm|hot lead|call ?back|follow ?up|demo|meeting|scheduled|good lead|qualified|site visit)/i, 'GOOD_LEAD_FOLLOW_UP'],
];

const SOURCE_KEYWORDS: Array<[RegExp, DataSource]> = [
  [/leads?\s*on\s*demand/i, 'leads_on_demand'],
  [/meridian/i, 'meridian_tower'],
  [/eden\s*park/i, 'eden_park'],
  [/varah\s*swamy/i, 'varah_swamy'],
  [/sarjapur/i, 'sarjapur_plots'],
];

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreMatch(header: string, keyword: string): number {
  if (header === keyword) return 100;
  const padded = ` ${header} `;
  const kw = ` ${keyword} `;
  if (padded.startsWith(kw) || padded.endsWith(kw)) return 80;
  if (padded.includes(kw)) return 60;
  // Looser substring match handles plurals & glued words, e.g.
  // "emails" ⊃ "email", "phonenumber" ⊃ "phone". Lowest priority.
  if (keyword.length >= 4 && header.includes(keyword)) return 40;
  return 0;
}

export interface HeaderMapping {
  /** CRM field → chosen source header (original casing). */
  fieldToHeader: Partial<Record<keyof typeof FIELD_SYNONYMS, string>>;
  firstNameHeader?: string;
  lastNameHeader?: string;
}

/**
 * Build a header→field mapping once per file, greedily assigning the
 * best-scoring header to each CRM field (no header reused).
 */
export function buildHeaderMapping(headers: string[]): HeaderMapping {
  const normalized = headers.map(normalizeHeader);
  const used = new Set<number>();
  const fieldToHeader: HeaderMapping['fieldToHeader'] = {};

  // Detect split first/last name columns up front. These are reserved for the
  // name-combination logic in heuristicMapRow, so exclude them from being
  // assigned to the generic `name` field (which they would weakly match).
  const firstIdx = normalized.findIndex((h) => /\b(first name|firstname|fname|given name)\b/.test(h));
  const lastIdx = normalized.findIndex((h) => /\b(last name|lastname|lname|surname|family name)\b/.test(h));
  if (firstIdx >= 0) used.add(firstIdx);
  if (lastIdx >= 0) used.add(lastIdx);

  // Rank (field, headerIndex, score) candidates and assign greedily.
  const candidates: Array<{ field: keyof typeof FIELD_SYNONYMS; idx: number; score: number }> = [];
  for (const field of Object.keys(FIELD_SYNONYMS) as Array<keyof typeof FIELD_SYNONYMS>) {
    normalized.forEach((h, idx) => {
      const score = Math.max(...FIELD_SYNONYMS[field].map((kw) => scoreMatch(h, kw)));
      if (score > 0) candidates.push({ field, idx, score });
    });
  }
  candidates.sort((a, b) => b.score - a.score);

  const filledFields = new Set<string>();
  for (const { field, idx } of candidates) {
    if (filledFields.has(field) || used.has(idx)) continue;
    fieldToHeader[field] = headers[idx];
    filledFields.add(field);
    used.add(idx);
  }

  return {
    fieldToHeader,
    firstNameHeader: firstIdx >= 0 ? headers[firstIdx] : undefined,
    lastNameHeader: lastIdx >= 0 ? headers[lastIdx] : undefined,
  };
}

export function guessStatus(text: string): CrmStatus | '' {
  for (const [re, status] of STATUS_KEYWORDS) {
    if (re.test(text)) return status;
  }
  return '';
}

export function guessSource(text: string): DataSource | '' {
  for (const [re, source] of SOURCE_KEYWORDS) {
    if (re.test(text)) return source;
  }
  return '';
}

/** Map a single raw CSV row to a CRM record using the header mapping. */
export function heuristicMapRow(
  row: Record<string, string>,
  mapping: HeaderMapping,
): CrmRecordInput {
  const get = (field: keyof typeof FIELD_SYNONYMS): string => {
    const header = mapping.fieldToHeader[field];
    return header ? (row[header] ?? '') : '';
  };

  // Name: prefer explicit name column, else combine first + last.
  let name = get('name');
  if (!name && (mapping.firstNameHeader || mapping.lastNameHeader)) {
    name = [
      mapping.firstNameHeader ? row[mapping.firstNameHeader] : '',
      mapping.lastNameHeader ? row[mapping.lastNameHeader] : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  const statusText = get('crm_status');
  const sourceText = get('data_source');

  return {
    created_at: get('created_at'),
    name,
    email: get('email'),
    country_code: get('country_code'),
    mobile_without_country_code: get('mobile_without_country_code'),
    company: get('company'),
    city: get('city'),
    state: get('state'),
    country: get('country'),
    lead_owner: get('lead_owner'),
    crm_status: guessStatus(statusText),
    crm_note: get('crm_note'),
    data_source: guessSource(sourceText),
    possession_time: get('possession_time'),
    description: get('description'),
  };
}

/** Map an entire batch heuristically. */
export function heuristicMapBatch(
  rows: Record<string, string>[],
  headers: string[],
): CrmRecordInput[] {
  const mapping = buildHeaderMapping(headers);
  return rows.map((row) => heuristicMapRow(row, mapping));
}
