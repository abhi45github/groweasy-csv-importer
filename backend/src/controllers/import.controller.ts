import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { parseCsv, ParsedCsv } from '../services/csv/csvParser';
import { describeProvider, extractLeads, ExtractionResult } from '../services/ai/extractor';
import { resolveProvider, LlmProvider } from '../services/ai/providers';
import { CRM_FIELDS } from '../types/crm';
import { ImportResponse, StreamEvent } from '../types/api';

/** Resolve the LLM provider once and reuse it across requests. */
let providerSingleton: LlmProvider | null | undefined;
function getProvider(): LlmProvider | null {
  if (providerSingleton === undefined) providerSingleton = resolveProvider();
  return providerSingleton;
}

function getCsvText(req: Request): string {
  if (req.file?.buffer) return req.file.buffer.toString('utf-8');
  const inline = (req.body as { csv?: unknown } | undefined)?.csv;
  if (typeof inline === 'string' && inline.trim()) return inline;
  throw AppError.badRequest(
    'No CSV provided. Upload a file under the "file" field, or POST JSON { "csv": "..." }.',
  );
}

function buildResponse(result: ExtractionResult, parsed: ParsedCsv): ImportResponse {
  return {
    success: true,
    provider: result.provider,
    summary: {
      totalRows: result.stats.totalRows,
      totalRowsInFile: parsed.totalRows,
      imported: result.stats.imported,
      skipped: result.stats.skipped,
      batches: result.stats.totalBatches,
      failedBatches: result.stats.failedBatches,
      truncated: parsed.truncated,
    },
    fields: CRM_FIELDS,
    records: result.records,
    skipped: result.skipped,
  };
}

/**
 * POST /api/import
 * One-shot import — parse the CSV, run AI extraction, return the full result.
 */
export async function handleImport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const csv = getCsvText(req);
    const parsed = parseCsv(csv, env.extraction.maxRows);
    const provider = getProvider();

    logger.info('Import started', {
      rows: parsed.rows.length,
      provider: describeProvider(provider).name,
    });

    const result = await extractLeads({
      headers: parsed.headers,
      rows: parsed.rows,
      provider,
    });

    logger.info('Import finished', {
      imported: result.stats.imported,
      skipped: result.stats.skipped,
    });

    res.json(buildResponse(result, parsed));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/import/stream
 * Streaming import — emits newline-delimited JSON events (meta → progress* →
 * result) so the UI can show live batch progress. Errors that occur before the
 * stream starts go through the normal error handler; errors mid-stream are sent
 * as a final { type: "error" } event.
 */
export async function handleImportStream(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let parsed: ParsedCsv;
  let provider: LlmProvider | null;

  // Anything that can produce a clean HTTP error must happen BEFORE we start
  // streaming (once headers are sent we can only emit in-band error events).
  try {
    const csv = getCsvText(req);
    parsed = parseCsv(csv, env.extraction.maxRows);
    provider = getProvider();
  } catch (error) {
    next(error);
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event: StreamEvent) => {
    res.write(JSON.stringify(event) + '\n');
  };

  const totalBatches = Math.max(1, Math.ceil(parsed.rows.length / env.extraction.batchSize));
  send({
    type: 'meta',
    provider: describeProvider(provider),
    totalRows: parsed.rows.length,
    totalRowsInFile: parsed.totalRows,
    totalBatches: parsed.rows.length === 0 ? 0 : totalBatches,
    truncated: parsed.truncated,
  });

  const abort = new AbortController();
  req.on('close', () => abort.abort());

  try {
    const result = await extractLeads({
      headers: parsed.headers,
      rows: parsed.rows,
      provider,
      signal: abort.signal,
      onProgress: (e) =>
        send({
          type: 'progress',
          processedRows: e.processedRows,
          totalRows: e.totalRows,
          imported: e.imported,
          skipped: e.skipped,
          completedBatches: e.completedBatches,
          totalBatches: e.totalBatches,
          failedBatches: e.failedBatches,
        }),
    });

    if (!res.writableEnded) {
      send({ type: 'result', data: buildResponse(result, parsed) });
    }
  } catch (error) {
    if (!abort.signal.aborted && !res.writableEnded) {
      const message = error instanceof Error ? error.message : 'Extraction failed.';
      logger.error('Streaming import failed', { message });
      send({ type: 'error', code: 'EXTRACTION_FAILED', message });
    }
  } finally {
    if (!res.writableEnded) res.end();
  }
}
