'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, SkipForward } from 'lucide-react';
import type { SkippedRecord } from '@/lib/types';
import { Pill } from './ui/Pill';
import { skipReasonLabel, cn } from '@/lib/utils';

export function SkippedList({ skipped }: { skipped: SkippedRecord[] }) {
  const [open, setOpen] = useState(false);
  if (skipped.length === 0) return null;

  return (
    <div className="rounded-2xl border border-warn/25 bg-warn/[0.05]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2.5">
          <SkipForward className="h-4 w-4 text-warn" />
          <span className="font-medium text-ink">
            {skipped.length} row{skipped.length === 1 ? '' : 's'} skipped
          </span>
          <span className="text-sm text-muted">— no email or mobile to import</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="scroll-fancy max-h-72 space-y-2 overflow-auto px-5 pb-5">
              {skipped.map((s) => {
                const preview = Object.entries(s.raw)
                  .filter(([, v]) => v && v.trim())
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('  ·  ');
                return (
                  <div
                    key={s.rowNumber}
                    className="flex items-start gap-3 rounded-xl border border-line bg-surface/70 px-4 py-3"
                  >
                    <span className="mt-0.5 font-mono text-[0.7rem] text-faint">
                      #{s.rowNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Pill tone="warn" className="mb-1.5">
                        {skipReasonLabel(s.reason)}
                      </Pill>
                      <p className="truncate font-mono text-[0.72rem] text-muted" title={preview}>
                        {preview || '(empty row)'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
