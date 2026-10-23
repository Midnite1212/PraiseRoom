import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('text-ink-2 px-4 py-10 text-center', className)}>
      <b className="text-ink mb-1 block">{title}</b>
      {children}
    </div>
  );
}
