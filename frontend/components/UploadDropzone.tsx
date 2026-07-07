'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FileUp, TableProperties, AlertCircle } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { SAMPLES, sampleToFile, type Sample } from '@/lib/samples';

interface UploadDropzoneProps {
  onFile: (file: File) => void;
  maxSizeMb: number;
}

export function UploadDropzone({ onFile, maxSizeMb }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setError(null);
      if (rejections.length > 0) {
        const code = rejections[0].errors[0]?.code;
        setError(
          code === 'file-too-large'
            ? `That file is over the ${maxSizeMb} MB limit.`
            : code === 'file-invalid-type'
              ? 'Please upload a .csv file.'
              : 'That file could not be accepted.',
        );
        return;
      }
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile, maxSizeMb],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    maxSize: maxSizeMb * 1024 * 1024,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv'],
    },
  });

  const loadSample = (sample: Sample) => {
    setError(null);
    onFile(sampleToFile(sample));
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        {...getRootProps()}
        className={cn(
          'group relative overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-14',
          isDragActive
            ? 'border-accent bg-accent/[0.06] shadow-glow'
            : 'border-line bg-surface/60 hover:border-faint hover:bg-surface',
        )}
      >
        <input {...getInputProps()} aria-label="CSV file input" />

        {/* Decorative sweep on drag */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-accent/[0.08] to-transparent"
          animate={{ x: isDragActive ? ['-100%', '100%'] : '-100%' }}
          transition={{ duration: 1.2, repeat: isDragActive ? Infinity : 0, ease: 'linear' }}
        />

        <div className="relative flex flex-col items-center">
          <motion.div
            animate={{ y: isDragActive ? -4 : 0, scale: isDragActive ? 1.05 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'grid h-16 w-16 place-items-center rounded-2xl border shadow-soft transition-colors',
              isDragActive
                ? 'border-accent/40 bg-accent/15 text-accent-ink dark:text-accent'
                : 'border-line bg-surface-2 text-primary',
            )}
          >
            <FileUp className="h-7 w-7" strokeWidth={1.75} />
          </motion.div>

          <h2 className="mt-6 font-display text-2xl font-medium tracking-tight text-ink">
            {isDragActive ? 'Drop it right here' : 'Drop a CSV, or browse'}
          </h2>
          <p className="mt-2 max-w-md text-balance text-sm text-muted">
            Facebook, Google Ads, Excel exports, real-estate CRMs, or a hand-made
            sheet — any column layout works. Up to {maxSizeMb} MB.
          </p>

          <button
            type="button"
            onClick={open}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[0.95rem] font-medium text-primary-ink shadow-soft transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <FileUp className="h-4 w-4" strokeWidth={2} />
            Choose file
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Sample data */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-faint">
          <TableProperties className="h-3.5 w-3.5" />
          Or try a sample
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => loadSample(sample)}
              className="group flex flex-col items-start rounded-xl border border-line bg-surface/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
            >
              <span className="font-medium text-ink transition-colors group-hover:text-primary">
                {sample.label}
              </span>
              <span className="mt-1 text-[0.78rem] leading-snug text-muted">
                {sample.description}
              </span>
              <span className="mt-3 font-mono text-[0.65rem] text-faint">
                {sample.filename} · {formatBytes(new Blob([sample.content]).size)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
