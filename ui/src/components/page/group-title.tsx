import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// A list section's heading with its count, and an optional hint or text action at the end. `first`
// is for the section that opens a page, which needs less room above it.
export function GroupTitle({
  title,
  count,
  action,
  hint,
  first = false,
  id,
  className,
}: {
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  hint?: ReactNode;
  first?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-2 flex items-center justify-between gap-2.5 px-1',
        first ? 'mt-4' : 'mt-10',
        className
      )}
    >
      <h2 id={id} className="text-ink-2 text-ui m-0 font-semibold">
        {title}
        {count === undefined ? null : (
          <small className="text-ink-3 ml-1.5 font-mono text-[0.8125rem] font-semibold">
            {count}
          </small>
        )}
      </h2>
      {hint ? <span className="text-ink-3 text-xs">{hint}</span> : null}
      {action}
    </div>
  );
}
