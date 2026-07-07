import { Cpu, Sparkles } from 'lucide-react';
import type { ProviderInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Shows whether extraction ran on a real LLM or the heuristic fallback. */
export function ProviderBadge({
  provider,
  className,
}: {
  provider: ProviderInfo;
  className?: string;
}) {
  const heuristic = provider.heuristic;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        heuristic
          ? 'border-warn/30 bg-warn/10 text-warn'
          : 'border-accent/30 bg-accent/12 text-accent-ink dark:text-accent',
        className,
      )}
      title={
        heuristic
          ? 'No LLM key configured — using the deterministic rule-based mapper.'
          : `Extracted with ${provider.name} · ${provider.model}`
      }
    >
      {heuristic ? (
        <Cpu className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      <span className="font-mono tracking-tight">
        {heuristic ? 'rule-based' : provider.name}
      </span>
      {!heuristic && (
        <span className="hidden text-accent-ink/60 dark:text-accent/60 sm:inline">
          · {provider.model}
        </span>
      )}
    </span>
  );
}
