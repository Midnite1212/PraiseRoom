import { Loader } from 'pixelarticons/react';
import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// A search or list that is still on its way: a spinner and a line announced to screen readers, with
// placeholder rows under it unless `compact`. Show the empty state only once a request has finished.
export function LoadingStatus({
  children,
  compact = false,
  className,
}: {
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <output className={cn('flex flex-col gap-3', className)}>
      <p className="text-ink-2 flex items-center gap-2 px-1 text-sm font-semibold">
        <Loader aria-hidden className="size-icon animate-spin" />
        {children}
      </p>
      {compact ? null : (
        <>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </>
      )}
    </output>
  );
}
