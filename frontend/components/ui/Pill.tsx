import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'primary' | 'accent' | 'info' | 'danger' | 'warn' | 'faint';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink border-line',
  primary: 'bg-primary/12 text-primary border-primary/25',
  accent: 'bg-accent/15 text-accent-ink dark:text-accent border-accent/30',
  info: 'bg-info/12 text-info border-info/25',
  danger: 'bg-danger/12 text-danger border-danger/25',
  warn: 'bg-warn/12 text-warn border-warn/25',
  faint: 'bg-transparent text-faint border-line/60',
};

export function Pill({
  children,
  tone = 'neutral',
  className,
  mono,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        mono && 'font-mono text-[0.7rem] tracking-tight',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  GOOD_LEAD_FOLLOW_UP: 'primary',
  SALE_DONE: 'accent',
  DID_NOT_CONNECT: 'info',
  BAD_LEAD: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: 'Good · Follow-up',
  SALE_DONE: 'Sale Done',
  DID_NOT_CONNECT: 'Did Not Connect',
  BAD_LEAD: 'Bad Lead',
};

export function StatusPill({ value }: { value?: string }) {
  if (!value) return <span className="text-faint">—</span>;
  return (
    <Pill tone={STATUS_TONES[value] ?? 'neutral'}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[value] ?? value}
    </Pill>
  );
}

export function SourcePill({ value }: { value?: string }) {
  if (!value) return <span className="text-faint">—</span>;
  return (
    <Pill tone="faint" mono>
      {value}
    </Pill>
  );
}
