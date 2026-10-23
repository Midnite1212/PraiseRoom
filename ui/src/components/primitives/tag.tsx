import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// A small capsule on a row: a folder, who shared it, a theme.
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'bg-fill-hover text-ink-2 inline-flex h-[22px] max-w-full items-center gap-[5px] rounded-full px-2 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:flex-none',
        className
      )}
    >
      {children}
    </span>
  );
}
