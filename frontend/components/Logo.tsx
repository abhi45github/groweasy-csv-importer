import { cn } from '@/lib/utils';

/** GrowEasy wordmark with a custom "sprout / upward flow" glyph. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface shadow-soft">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
          <path
            d="M4 20c0-6 3.5-9.5 8.5-10.5"
            stroke="rgb(var(--c-primary))"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M12.5 9.5C15 6 19 5.5 20 5.5c0 4-1.5 8-8 9"
            stroke="rgb(var(--c-accent))"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="4" cy="20" r="1.6" fill="rgb(var(--c-primary))" />
        </svg>
      </span>
      <div className="leading-none">
        <div className="font-display text-[1.25rem] font-semibold tracking-tight text-ink">
          GrowEasy
        </div>
        <div className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
          CSV → CRM
        </div>
      </div>
    </div>
  );
}
