import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// A list section's heading with its count, and an optional text action at the end.
export function GroupTitle({
  title,
  count,
  action,
  id,
  className,
}: {
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn('mt-6 mb-1.5 flex items-center justify-between gap-2.5 px-1', className)}>
      <h2 id={id} className="text-ink-2 m-0 text-[0.9375rem] font-semibold">
        {title}
        {count === undefined ? null : (
          <small className="text-ink-3 ml-1.5 font-mono text-[0.8125rem] font-semibold">
            {count}
          </small>
        )}
      </h2>
      {action}
    </div>
  );
}
