import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Rows sit on bare ground, no cards: a row lights up when you hover or touch it.
export const LIST_CLASSES = 'm-0 flex list-none flex-col gap-0.5 p-0';

// Tighter rows for lists that are mostly for reference, like played setlists.
export const LIST_COMPACT_CLASSES = 'm-0 flex list-none flex-col gap-0 p-0';

export const listRowClasses = (className?: string) =>
  cn(
    'hover:bg-fill-hover relative grid min-h-16 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors duration-150 ease-out',
    className
  );

export function RowText({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <span className="min-w-0">
      <span className="block truncate font-semibold">{title}</span>
      {meta ? (
        <span className="text-ink-2 mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem]">
          {meta}
        </span>
      ) : null}
    </span>
  );
}

// The key at the end of a song row.
export function RowKey({ children }: { children: ReactNode }) {
  return <span className="text-ink text-ui text-right font-mono font-bold">{children}</span>;
}
