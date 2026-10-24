import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const PIXEL_DELAYS = [
  '',
  '[animation-delay:150ms]',
  '[animation-delay:300ms]',
  '[animation-delay:450ms]',
];

// Four pixels lighting in turn; under reduced motion the first one stays lit.
function PixelRun() {
  return (
    <span aria-hidden className="inline-flex gap-[3px]">
      {PIXEL_DELAYS.map((delay) => (
        <i
          key={delay}
          className={cn(
            'bg-pixel-off size-1.5 motion-safe:animate-pix-run motion-reduce:first:bg-pixel-on',
            delay
          )}
        />
      ))}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div
      aria-hidden
      className="motion-safe:animate-skel-breathe flex items-center gap-3.5 px-1 py-2.5"
    >
      <i className="bg-fill-hover size-13 flex-none rounded-[14px]" />
      <span className="grid flex-1 gap-2">
        <b className="bg-fill-hover h-2.5" />
        <b className="bg-fill-hover h-2.5 w-[45%]" />
      </span>
    </div>
  );
}

// A search or list that is still on its way: four pixels running and a line announced to screen
// readers, with placeholder rows under it unless `compact`. Show the empty state only once a
// request has finished.
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
    <output className={cn('flex flex-col', className)}>
      <p className="text-ink-2 flex items-center gap-3 px-1 py-3.5 text-sm">
        <PixelRun />
        {children}
      </p>
      {compact ? null : (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      )}
    </output>
  );
}
