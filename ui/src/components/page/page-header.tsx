import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const PAGE_TITLE_CLASSES = 'm-0 text-page-title font-bold tracking-[-0.03em] text-balance';

// The big page title (it scrolls away under the phone top bar), an optional line under it (Home's
// date), and the page's labelled actions on wide screens; phones get the floating action button instead.
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
    <header
      className={cn(
        'wide:mb-2.5 wide:min-h-(--head-h) wide:items-center mb-4 flex items-end justify-between gap-3',
        className
      )}
    >
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
