/**
 * GrowEasy CRM domain model.
 *
 * These are the canonical target fields the AI maps arbitrary CSV columns into,
 * plus the closed value sets the assignment mandates for `crm_status` and
 * `data_source`.
 */

export const CRM_STATUS_VALUES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];

export const DATA_SOURCE_VALUES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
] as const;

export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

/**
 * The ordered list of CRM fields. Order matters for CSV export so it matches
 * the assignment's sample header exactly.
 */
export const CRM_FIELDS = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
] as const;

export type CrmField = (typeof CRM_FIELDS)[number];

/**
 * A single extracted CRM record. Every field is optional at the type level
 * because source CSVs are unpredictable — normalisation guarantees the invariants
 * the assignment requires (e.g. at least one of email / mobile).
 */
export interface CrmRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: CrmStatus | '';
  crm_note?: string;
  data_source?: DataSource | '';
  possession_time?: string;
  description?: string;
}

/** Reason a source row was dropped during extraction. */
export type SkipReason =
  | 'missing_email_and_mobile'
  | 'empty_row'
  | 'ai_batch_failed';

export interface SkippedRecord {
  /** 1-based index of the row in the original upload (excluding header). */
  rowNumber: number;
  reason: SkipReason;
  /** Human-friendly explanation for the UI. */
  message: string;
  /** The original row values, for transparency in the UI. */
  raw: Record<string, string>;
}

export interface ExtractedRecord extends CrmRecord {
  /** 1-based index of the source row this record came from. */
  rowNumber: number;
}
