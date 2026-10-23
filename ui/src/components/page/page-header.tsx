import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const PAGE_TITLE_CLASSES =
  'm-0 text-[clamp(1.75rem,1.2rem+2.2vw,2.5rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance';

// The big page title (it scrolls away under the phone top bar), a line under it, and the page's
// labelled actions on wide screens; phones get the floating action button instead.
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-[18px] flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 data-page-title className={PAGE_TITLE_CLASSES}>
          {title}
        </h1>
        {description ? <p className="text-ink-2 mt-1.5">{description}</p> : null}
      </div>
      {actions ? (
        <div className="wide:flex hidden flex-none items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
