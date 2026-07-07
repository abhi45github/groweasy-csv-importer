'use client';

import { motion } from 'framer-motion';
import { Sparkles, X, Layers, CheckCircle2, SkipForward } from 'lucide-react';
import type { ProgressState, ProviderInfo } from '@/lib/types';
import { ProviderBadge } from './ProviderBadge';
import { CountUp } from './ui/CountUp';
import { Button } from './ui/Button';

interface ProcessingPanelProps {
  progress: ProgressState | null;
  provider: ProviderInfo | null;
  fileName: string;
  onCancel: () => void;
}

const RADIUS = 74;
const CIRC = 2 * Math.PI * RADIUS;

export function ProcessingPanel({
  progress,
  provider,
  fileName,
  onCancel,
}: ProcessingPanelProps) {
  const total = progress?.totalRows ?? 0;
  const processed = progress?.processedRows ?? 0;
  const pct = total > 0 ? Math.min(1, processed / total) : 0;
  const indeterminate = !progress || total === 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-line bg-surface/70 p-8 text-center shadow-soft sm:p-12">
      <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-faint">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        Extracting CRM records
      </div>
      <p className="mb-8 max-w-sm text-sm text-muted">
        Mapping your columns into the GrowEasy schema
        <span className="mx-1 font-mono text-ink/70">·</span>
        <span className="font-mono text-ink/80">{fileName}</span>
      </p>

      {/* Progress ring */}
      <div className="relative grid h-48 w-48 place-items-center">
        <svg className="h-48 w-48 -rotate-90" viewBox="0 0 176 176">
          <circle
            cx="88"
            cy="88"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            className="stroke-line"
          />
          <motion.circle
            cx="88"
            cy="88"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-accent"
            style={{ strokeDasharray: CIRC }}
            initial={{ strokeDashoffset: CIRC }}
            animate={
              indeterminate
                ? { strokeDashoffset: [CIRC, CIRC * 0.25, CIRC], rotate: [0, 360] }
                : { strokeDashoffset: CIRC * (1 - pct) }
            }
            transition={
              indeterminate
                ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.6, ease: 'easeOut' }
            }
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-4xl font-semibold tabular text-ink">
            {indeterminate ? '···' : `${Math.round(pct * 100)}%`}
          </span>
          <span className="mt-1 font-mono text-[0.68rem] uppercase tracking-widest text-faint">
            {progress
              ? `batch ${progress.completedBatches}/${progress.totalBatches}`
              : 'starting'}
          </span>
        </div>
      </div>

      {/* Live stats */}
      <div className="mt-8 grid w-full grid-cols-3 gap-3">
        <Stat
          icon={<Layers className="h-4 w-4" />}
          label="Rows"
          value={processed}
          sub={`of ${total}`}
        />
        <Stat
          icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
          label="Imported"
          value={progress?.imported ?? 0}
          tone="primary"
        />
        <Stat
          icon={<SkipForward className="h-4 w-4 text-warn" />}
          label="Skipped"
          value={progress?.skipped ?? 0}
          tone="warn"
        />
      </div>

      <div className="mt-8 flex items-center gap-4">
        {provider && <ProviderBadge provider={provider} />}
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  tone?: 'neutral' | 'primary' | 'warn';
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
      <div className="flex items-center justify-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-faint">
        {icon}
        {label}
      </div>
      <div
        className={
          'mt-1.5 font-display text-2xl font-semibold ' +
          (tone === 'primary' ? 'text-primary' : tone === 'warn' ? 'text-warn' : 'text-ink')
        }
      >
        <CountUp value={value} />
      </div>
      {sub && <div className="font-mono text-[0.65rem] text-faint">{sub}</div>}
    </div>
  );
}
