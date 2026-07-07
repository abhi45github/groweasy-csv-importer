/** Client-side mirror of the backend's CRM & API contracts. */

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

/** Human labels for CRM columns in the results table. */
export const CRM_FIELD_LABELS: Record<CrmField, string> = {
  created_at: 'Created At',
  name: 'Name',
  email: 'Email',
  country_code: 'Code',
  mobile_without_country_code: 'Mobile',
  company: 'Company',
  city: 'City',
  state: 'State',
  country: 'Country',
  lead_owner: 'Lead Owner',
  crm_status: 'CRM Status',
  crm_note: 'CRM Note',
  data_source: 'Data Source',
  possession_time: 'Possession',
  description: 'Description',
};

export type CrmRecord = Partial<Record<CrmField, string>>;

export interface ExtractedRecord extends CrmRecord {
  rowNumber: number;
}

export type SkipReason =
  | 'missing_email_and_mobile'
  | 'empty_row'
  | 'ai_batch_failed';

export interface SkippedRecord {
  rowNumber: number;
  reason: SkipReason;
  message: string;
  raw: Record<string, string>;
}

export interface ProviderInfo {
  name: string;
  model: string;
  heuristic: boolean;
}

export interface ImportSummary {
  totalRows: number;
  totalRowsInFile: number;
  imported: number;
  skipped: number;
  batches: number;
  failedBatches: number;
  truncated: boolean;
}

export interface ImportResponse {
  success: true;
  provider: ProviderInfo;
  summary: ImportSummary;
  fields: readonly CrmField[];
  records: ExtractedRecord[];
  skipped: SkippedRecord[];
}

export interface AppConfig {
  provider: ProviderInfo;
  fields: readonly CrmField[];
  statuses: string[];
  sources: string[];
  limits: { maxRows: number; maxUploadMb: number; batchSize: number };
}

/** Streaming events emitted by POST /api/import/stream (newline-delimited JSON). */
export type StreamEvent =
  | {
      type: 'meta';
      provider: ProviderInfo;
      totalRows: number;
      totalRowsInFile: number;
      totalBatches: number;
      truncated: boolean;
    }
  | {
      type: 'progress';
      processedRows: number;
      totalRows: number;
      imported: number;
      skipped: number;
      completedBatches: number;
      totalBatches: number;
      failedBatches: number;
    }
  | { type: 'result'; data: ImportResponse }
  | { type: 'error'; code: string; message: string };

export interface ProgressState {
  processedRows: number;
  totalRows: number;
  imported: number;
  skipped: number;
  completedBatches: number;
  totalBatches: number;
  failedBatches: number;
}
