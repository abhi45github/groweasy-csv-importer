'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type StepId = 'upload' | 'preview' | 'extract' | 'results';

export const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 'upload', label: 'Upload', hint: 'Any CSV format' },
  { id: 'preview', label: 'Preview', hint: 'Review your data' },
  { id: 'extract', label: 'Extract', hint: 'AI field mapping' },
  { id: 'results', label: 'Results', hint: 'Clean CRM records' },
];

export function Stepper({ current }: { current: StepId }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'todo';
        return (
          <li key={step.id} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'relative grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors',
                  state === 'done' && 'border-primary/40 bg-primary/15 text-primary',
                  state === 'active' && 'border-accent bg-accent text-accent-ink',
                  state === 'todo' && 'border-line bg-surface text-faint',
                )}
              >
                {state === 'active' && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full border border-accent" />
                )}
                {state === 'done' ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <span className="tabular">{i + 1}</span>
                )}
              </div>
              <div className="hidden min-w-0 sm:block">
                <div
                  className={cn(
                    'text-sm font-medium leading-tight transition-colors',
                    state === 'todo' ? 'text-faint' : 'text-ink',
                  )}
                >
                  {step.label}
                </div>
                <div className="truncate text-[0.7rem] text-faint">{step.hint}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="relative h-px flex-1 overflow-hidden bg-line">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={false}
                  animate={{ width: i < currentIndex ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
