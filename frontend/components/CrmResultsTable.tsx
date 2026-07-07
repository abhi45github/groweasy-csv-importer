'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CRM_FIELD_LABELS, type CrmField, type ExtractedRecord } from '@/lib/types';
import { StatusPill, SourcePill } from './ui/Pill';
import { cn } from '@/lib/utils';

const WIDTHS: Record<CrmField, number> = {
  created_at: 168,
  name: 168,
  email: 224,
  country_code: 78,
  mobile_without_country_code: 148,
  company: 160,
  city: 124,
  state: 124,
  country: 128,
  lead_owner: 188,
  crm_status: 186,
  crm_note: 300,
  data_source: 154,
  possession_time: 148,
  description: 224,
};

const ROW_HEIGHT = 48;

export function CrmResultsTable({
  records,
  fields,
}: {
  records: ExtractedRecord[];
  fields: readonly CrmField[];
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const gridTemplate =
    `56px ` + fields.map((f) => `${WIDTHS[f] ?? 150}px`).join(' ');
  const items = virtualizer.getVirtualItems();

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center text-sm text-muted">
        No records were imported from this file.
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="scroll-fancy max-h-[62vh] overflow-auto rounded-2xl border border-line bg-surface/70"
    >
      <div className="min-w-max">
        <div
          className="sticky top-0 z-20 grid border-b border-line bg-surface-2/95 backdrop-blur"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="px-3 py-3 text-[0.68rem] font-semibold uppercase tracking-wider text-faint">
            Row
          </div>
          {fields.map((f) => (
            <div
              key={f}
              className="border-l border-line/60 px-3 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-wider text-muted"
            >
              {CRM_FIELD_LABELS[f]}
            </div>
          ))}
        </div>

        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {items.map((item) => {
            const rec = records[item.index];
            return (
              <div
                key={item.key}
                className={cn(
                  'absolute left-0 top-0 grid w-full items-center border-b border-line/40',
                  item.index % 2 === 1 && 'bg-surface-2/40',
                )}
                style={{
                  height: ROW_HEIGHT,
                  transform: `translateY(${item.start}px)`,
                  gridTemplateColumns: gridTemplate,
                }}
              >
                <div className="px-3 font-mono text-[0.7rem] text-faint tabular">
                  {rec.rowNumber}
                </div>
                {fields.map((f) => (
                  <Cell key={f} field={f} value={rec[f]} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Cell({ field, value }: { field: CrmField; value?: string }) {
  const base = 'border-l border-line/30 px-3 h-full flex items-center min-w-0';

  if (field === 'crm_status') {
    return (
      <div className={base}>
        <StatusPill value={value} />
      </div>
    );
  }
  if (field === 'data_source') {
    return (
      <div className={base}>
        <SourcePill value={value} />
      </div>
    );
  }

  const empty = !value;
  const mono =
    field === 'email' ||
    field === 'mobile_without_country_code' ||
    field === 'country_code' ||
    field === 'created_at';

  return (
    <div className={base}>
      <span
        className={cn(
          'truncate text-[0.82rem]',
          mono && 'font-mono text-[0.76rem]',
          empty ? 'text-faint' : 'text-ink/90',
        )}
        title={value || undefined}
      >
        {empty ? '—' : value}
      </span>
    </div>
  );
}
