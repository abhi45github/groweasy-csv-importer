'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileJson, Copy, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import type { ImportResponse } from '@/lib/types';
import { SummaryStats } from './SummaryStats';
import { CrmResultsTable } from './CrmResultsTable';
import { SkippedList } from './SkippedList';
import { ProviderBadge } from './ProviderBadge';
import { Button } from './ui/Button';
import { recordsToCsv, recordsToJson } from '@/lib/csv';
import { baseName, copyToClipboard, downloadFile } from '@/lib/utils';

export function ResultsView({
  result,
  fileName,
  onReset,
}: {
  result: ImportResponse;
  fileName: string;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const stem = baseName(fileName) || 'groweasy-leads';

  const handleCsv = () =>
    downloadFile(`${stem}-crm.csv`, recordsToCsv(result.records, result.fields), 'text/csv');
  const handleJson = () =>
    downloadFile(
      `${stem}-crm.json`,
      recordsToJson(result.records),
      'application/json',
    );
  const handleCopy = async () => {
    if (await copyToClipboard(recordsToJson(result.records))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const disabled = result.records.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
            Extraction complete
          </h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="font-mono text-ink/70">{fileName}</span>
            <span className="text-faint">·</span>
            mapped into GrowEasy CRM format
          </p>
        </div>
        <ProviderBadge provider={result.provider} />
      </div>

      <SummaryStats summary={result.summary} />

      {result.summary.truncated && (
        <div className="flex items-center gap-2.5 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Only the first {result.summary.totalRows.toLocaleString()} of{' '}
          {result.summary.totalRowsInFile.toLocaleString()} rows were processed (row cap).
        </div>
      )}

      {result.summary.failedBatches > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {result.summary.failedBatches} of {result.summary.batches} batch
          {result.summary.batches === 1 ? '' : 'es'} used the rule-based fallback
          (the LLM was unavailable for those rows).
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="accent" onClick={handleCsv} disabled={disabled}>
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
        <Button variant="secondary" onClick={handleJson} disabled={disabled}>
          <FileJson className="h-4 w-4" />
          Download JSON
        </Button>
        <Button variant="secondary" onClick={handleCopy} disabled={disabled}>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy JSON'}
        </Button>
        <div className="ml-auto">
          <Button variant="ghost" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Import another file
          </Button>
        </div>
      </div>

      {/* Records */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-faint">
          Imported records
          <span className="font-mono text-muted">({result.records.length})</span>
        </div>
        <CrmResultsTable records={result.records} fields={result.fields} />
      </div>

      <SkippedList skipped={result.skipped} />
    </motion.div>
  );
}
