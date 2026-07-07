'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  FileSpreadsheet,
  Columns3,
  Rows3,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Stepper, type StepId } from '@/components/Stepper';
import { UploadDropzone } from '@/components/UploadDropzone';
import { PreviewTable } from '@/components/PreviewTable';
import { ProcessingPanel } from '@/components/ProcessingPanel';
import { ResultsView } from '@/components/ResultsView';
import { ProviderBadge } from '@/components/ProviderBadge';
import { Button } from '@/components/ui/Button';

import { parseCsvClient, type ParsedPreview } from '@/lib/csv';
import { fetchConfig, importCsvStream, ApiError } from '@/lib/api';
import type {
  AppConfig,
  ImportResponse,
  ProgressState,
  ProviderInfo,
} from '@/lib/types';
import { formatBytes, formatNumber } from '@/lib/utils';

export default function Home() {
  const [step, setStep] = useState<StepId>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [streamProvider, setStreamProvider] = useState<ProviderInfo | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const maxUploadMb = config?.limits.maxUploadMb ?? 10;

  useEffect(() => {
    const ctrl = new AbortController();
    fetchConfig(ctrl.signal)
      .then(setConfig)
      .catch(() => setConfig(null));
    return () => ctrl.abort();
  }, []);

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    try {
      const text = await f.text();
      const parsed = parseCsvClient(text);
      if (parsed.headers.length === 0 || parsed.rowCount === 0) {
        setError('We could not find any data rows in that CSV. Please check the file.');
        return;
      }
      setFile(f);
      setPreview(parsed);
      setResult(null);
      setStep('preview');
    } catch {
      setError('That file could not be read as text. Please upload a valid CSV.');
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file) return;
    setError(null);
    setProgress(null);
    setStreamProvider(null);
    setStep('extract');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await importCsvStream(
        file,
        {
          onMeta: (m) => setStreamProvider(m.provider),
          onProgress: (p) =>
            setProgress({
              processedRows: p.processedRows,
              totalRows: p.totalRows,
              imported: p.imported,
              skipped: p.skipped,
              completedBatches: p.completedBatches,
              totalBatches: p.totalBatches,
              failedBatches: p.failedBatches,
            }),
        },
        controller.signal,
      );
      setResult(res);
      setStep('results');
    } catch (err) {
      if (controller.signal.aborted) return; // user cancelled
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong while extracting. Please try again.';
      setError(message);
      setStep('preview');
    } finally {
      abortRef.current = null;
    }
  }, [file]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStep('preview');
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(null);
    setError(null);
    setStep('upload');
  }, []);

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            {config && (
              <div className="hidden sm:block">
                <ProviderBadge provider={config.provider} />
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8">
        {/* Stepper */}
        <div className="mb-10 rounded-2xl border border-line bg-surface/50 px-5 py-4 sm:px-7">
          <Stepper current={step} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ── UPLOAD ─────────────────────────────────────── */}
            {step === 'upload' && (
              <section>
                <div className="mx-auto mb-12 max-w-2xl text-center">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-1.5 text-xs font-medium text-muted">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    AI-powered field mapping
                  </div>
                  <h1 className="text-balance font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
                    Turn any CSV into clean{' '}
                    <span className="italic text-primary">CRM leads</span>.
                  </h1>
                  <p className="mx-auto mt-5 max-w-xl text-balance text-[1.02rem] leading-relaxed text-muted">
                    Upload a messy export with any column names. Our AI reads it,
                    maps the fields, and hands you tidy GrowEasy CRM records — ready
                    to import.
                  </p>
                </div>

                {error && <ErrorBanner message={error} />}
                <UploadDropzone onFile={handleFile} maxSizeMb={maxUploadMb} />
              </section>
            )}

            {/* ── PREVIEW ────────────────────────────────────── */}
            {step === 'preview' && preview && file && (
              <section className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
                      Review your data
                    </h2>
                    <p className="mt-1.5 text-sm text-muted">
                      This is a preview of your file. Nothing is sent to the AI until
                      you confirm.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MetaChip
                      icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
                      label={file.name}
                    />
                    <MetaChip
                      icon={<Rows3 className="h-3.5 w-3.5" />}
                      label={`${formatNumber(preview.rowCount)} rows`}
                    />
                    <MetaChip
                      icon={<Columns3 className="h-3.5 w-3.5" />}
                      label={`${preview.headers.length} cols`}
                    />
                    <MetaChip label={formatBytes(file.size)} />
                  </div>
                </div>

                {error && <ErrorBanner message={error} />}

                <PreviewTable headers={preview.headers} rows={preview.rows} />

                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="ghost" onClick={handleReset}>
                    Choose a different file
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="hidden items-center gap-1.5 text-xs text-faint sm:flex">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Data is processed only after you confirm
                    </span>
                    <Button variant="accent" size="lg" onClick={handleConfirm}>
                      Confirm &amp; Extract
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* ── EXTRACT ────────────────────────────────────── */}
            {step === 'extract' && (
              <ProcessingPanel
                progress={progress}
                provider={streamProvider ?? config?.provider ?? null}
                fileName={file?.name ?? 'your file'}
                onCancel={handleCancel}
              />
            )}

            {/* ── RESULTS ────────────────────────────────────── */}
            {step === 'results' && result && (
              <ResultsView
                result={result}
                fileName={file?.name ?? 'import.csv'}
                onReset={handleReset}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-faint sm:flex-row sm:px-8">
          <span>GrowEasy · AI CSV → CRM Importer</span>
          <span className="font-mono">Next.js · Express · LLM extraction</span>
        </div>
      </footer>
    </div>
  );
}

function MetaChip({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-lg border border-line bg-surface/70 px-2.5 py-1.5 font-mono text-[0.72rem] text-muted">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mb-6 flex max-w-3xl items-center gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </motion.div>
  );
}
