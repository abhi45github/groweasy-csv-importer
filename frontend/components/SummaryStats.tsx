'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, SkipForward, Rows3, Target } from 'lucide-react';
import type { ImportSummary } from '@/lib/types';
import { CountUp } from './ui/CountUp';
import { cn } from '@/lib/utils';

const cards = [
  { key: 'imported', label: 'Imported', icon: Rows3, tone: 'primary' as const },
  { key: 'skipped', label: 'Skipped', icon: SkipForward, tone: 'warn' as const },
  { key: 'total', label: 'Rows Processed', icon: CheckCircle2, tone: 'ink' as const },
  { key: 'rate', label: 'Extraction Rate', icon: Target, tone: 'accent' as const },
];

const toneText: Record<string, string> = {
  primary: 'text-primary',
  warn: 'text-warn',
  ink: 'text-ink',
  accent: 'text-accent-ink dark:text-accent',
};

export function SummaryStats({ summary }: { summary: ImportSummary }) {
  const rate =
    summary.totalRows > 0
      ? Math.round((summary.imported / summary.totalRows) * 100)
      : 0;

  const values: Record<string, string | number> = {
    imported: summary.imported,
    skipped: summary.skipped,
    total: summary.totalRows,
    rate,
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-line bg-surface/70 p-4 shadow-soft sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.72rem] font-medium uppercase tracking-wider text-faint">
                {card.label}
              </span>
              <Icon className={cn('h-4 w-4', toneText[card.tone])} strokeWidth={2} />
            </div>
            <div
              className={cn(
                'mt-2 font-display text-[2.1rem] font-semibold leading-none',
                toneText[card.tone],
              )}
            >
              <CountUp value={values[card.key] as number} />
              {card.key === 'rate' && <span className="text-2xl">%</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
