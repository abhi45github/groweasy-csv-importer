import { CrmField, ExtractedRecord, SkippedRecord } from './crm';
import { ProviderInfo } from '../services/ai/extractor';

export interface ImportSummary {
  /** Rows actually processed (after the MAX_ROWS cap). */
  totalRows: number;
  /** Rows present in the uploaded file before any capping. */
  totalRowsInFile: number;
  imported: number;
  skipped: number;
  batches: number;
  /** Batches that fell back to the heuristic mapper. */
  failedBatches: number;
  /** True if the file exceeded MAX_ROWS and was truncated. */
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

/** Newline-delimited JSON events emitted by the streaming endpoint. */
export type StreamEvent =
  | { type: 'meta'; provider: ProviderInfo; totalRows: number; totalBatches: number; truncated: boolean; totalRowsInFile: number }
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
