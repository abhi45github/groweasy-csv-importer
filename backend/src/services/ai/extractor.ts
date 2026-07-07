import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { chunk, mapWithConcurrency } from '../../utils/concurrency';
import { withRetry } from '../../utils/retry';
import { ExtractedRecord, SkippedRecord } from '../../types/crm';
import { crmBatchSchema, CrmRecordInput } from '../crm/schema';
import { normalizeRecord } from '../crm/normalize';
import { heuristicMapBatch } from './fallbackMapper';
import { parseJsonObject } from './jsonParse';
import { buildUserPrompt, PromptRow, SYSTEM_PROMPT } from './prompt';
import { LlmError } from './providers/types';
import type { LlmProvider } from './providers';

export interface ProviderInfo {
  name: string;
  model: string;
  /** True when NO LLM ran at all (pure heuristic mode). */
  heuristic: boolean;
}

export interface ExtractionStats {
  totalRows: number;
  processedRows: number;
  imported: number;
  skipped: number;
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
}

export interface ProgressEvent extends ExtractionStats {
  provider: ProviderInfo;
}

export interface ExtractionResult {
  records: ExtractedRecord[];
  skipped: SkippedRecord[];
  stats: ExtractionStats;
  provider: ProviderInfo;
}

export interface ExtractOptions {
  headers: string[];
  rows: Record<string, string>[];
  provider: LlmProvider | null;
  onProgress?: (event: ProgressEvent) => void;
  signal?: AbortSignal;
}

interface BatchOutcome {
  records: ExtractedRecord[];
  skipped: SkippedRecord[];
  usedFallback: boolean;
}

/** Call the LLM for one batch and validate the shape & row count. */
async function callProvider(
  provider: LlmProvider,
  batch: PromptRow[],
): Promise<CrmRecordInput[]> {
  const text = await provider.complete({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(batch),
  });

  const parsed = parseJsonObject(text);
  const validated = crmBatchSchema.parse(parsed);

  if (validated.records.length !== batch.length) {
    // Deterministic (temp=0) — a count mismatch won't fix itself on retry.
    throw new LlmError(
      `Model returned ${validated.records.length} records for ${batch.length} rows.`,
      undefined,
      false,
    );
  }
  return validated.records;
}

function normalizeBatch(
  batch: PromptRow[],
  mapped: CrmRecordInput[],
): { records: ExtractedRecord[]; skipped: SkippedRecord[] } {
  const records: ExtractedRecord[] = [];
  const skipped: SkippedRecord[] = [];
  batch.forEach((item, i) => {
    const { ok, skipped: skip } = normalizeRecord(mapped[i] ?? {}, item.data, item.row);
    if (ok) records.push(ok);
    else if (skip) skipped.push(skip);
  });
  return { records, skipped };
}

async function processBatch(
  batch: PromptRow[],
  headers: string[],
  provider: LlmProvider | null,
  batchIndex: number,
): Promise<BatchOutcome> {
  let mapped: CrmRecordInput[] | null = null;
  let usedFallback = false;

  if (provider) {
    try {
      mapped = await withRetry(() => callProvider(provider, batch), {
        retries: env.extraction.maxRetries,
        shouldRetry: (error) => error instanceof LlmError && error.retryable,
        onRetry: (error, attempt, delayMs) =>
          logger.warn(`Batch ${batchIndex + 1}: retry ${attempt}`, {
            delayMs,
            error: error instanceof Error ? error.message : String(error),
          }),
      });
    } catch (error) {
      logger.warn(`Batch ${batchIndex + 1}: AI extraction failed, using heuristic fallback`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!mapped) {
    mapped = heuristicMapBatch(
      batch.map((b) => b.data),
      headers,
    );
    usedFallback = true;
  }

  const { records, skipped } = normalizeBatch(batch, mapped);
  return { records, skipped, usedFallback };
}

export function describeProvider(provider: LlmProvider | null): ProviderInfo {
  return provider
    ? { name: provider.name, model: provider.model, heuristic: false }
    : { name: 'heuristic', model: 'rule-based mapper', heuristic: true };
}

/**
 * Extract CRM records from parsed CSV rows: batch → AI (with retry) → heuristic
 * fallback → normalise → aggregate. Emits cumulative progress after each batch.
 */
export async function extractLeads({
  headers,
  rows,
  provider,
  onProgress,
  signal,
}: ExtractOptions): Promise<ExtractionResult> {
  const promptRows: PromptRow[] = rows.map((data, i) => ({ row: i + 1, data }));
  const batches = chunk(promptRows, env.extraction.batchSize);
  const providerInfo = describeProvider(provider);

  const stats: ExtractionStats = {
    totalRows: rows.length,
    processedRows: 0,
    imported: 0,
    skipped: 0,
    totalBatches: batches.length,
    completedBatches: 0,
    failedBatches: 0,
  };

  const allRecords: ExtractedRecord[] = [];
  const allSkipped: SkippedRecord[] = [];

  // Process batches with bounded concurrency, but report progress as each
  // finishes (order-independent) so the UI streams live counts.
  await mapWithConcurrency(batches, env.extraction.concurrency, async (batch, index) => {
    if (signal?.aborted) throw new Error('Extraction aborted by client.');

    const outcome = await processBatch(batch, headers, provider, index);

    allRecords.push(...outcome.records);
    allSkipped.push(...outcome.skipped);

    stats.processedRows += batch.length;
    stats.imported += outcome.records.length;
    stats.skipped += outcome.skipped.length;
    stats.completedBatches += 1;
    if (outcome.usedFallback) stats.failedBatches += 1;

    onProgress?.({ ...stats, provider: providerInfo });
    return outcome;
  });

  // Keep output stable & intuitive: ordered by original row number.
  allRecords.sort((a, b) => a.rowNumber - b.rowNumber);
  allSkipped.sort((a, b) => a.rowNumber - b.rowNumber);

  return { records: allRecords, skipped: allSkipped, stats, provider: providerInfo };
}
