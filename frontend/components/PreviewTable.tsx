'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface PreviewTableProps {
  headers: string[];
  rows: string[][];
  /** Cap the number of rows fed to the DOM/virtualizer. */
  maxRows?: number;
}

const ROW_HEIGHT = 40;

export function PreviewTable({ headers, rows, maxRows = 100000 }: PreviewTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const visibleRows = rows.length > maxRows ? rows.slice(0, maxRows) : rows;

  const virtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 14,
  });

  const gridTemplate = `64px repeat(${headers.length}, minmax(168px, 1fr))`;
  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="scroll-fancy max-h-[58vh] overflow-auto rounded-2xl border border-line bg-surface/70"
    >
      <div className="min-w-max">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-20 grid border-b border-line bg-surface-2/95 backdrop-blur"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="px-3 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-faint">
            #
          </div>
          {headers.map((h, i) => (
            <div
              key={i}
              className="truncate border-l border-line/60 px-3 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-wider text-muted"
              title={h}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Virtualized body */}
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {items.map((item) => {
            const row = visibleRows[item.index];
            return (
              <div
                key={item.key}
                className={cn(
                  'absolute left-0 top-0 grid w-full items-center border-b border-line/40 text-sm',
                  item.index % 2 === 1 && 'bg-surface-2/40',
                )}
                style={{
                  height: ROW_HEIGHT,
                  transform: `translateY(${item.start}px)`,
                  gridTemplateColumns: gridTemplate,
                }}
              >
                <div className="px-3 font-mono text-[0.7rem] text-faint tabular">
                  {item.index + 1}
                </div>
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className="truncate border-l border-line/30 px-3 font-mono text-[0.78rem] text-ink/90"
                    title={cell}
                  >
                    {cell === '' ? <span className="text-faint">—</span> : cell}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
