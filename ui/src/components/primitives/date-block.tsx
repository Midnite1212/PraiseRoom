import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import type { SetStatus } from './set-status';

const BOX_SIZES = {
  md: 'size-[52px] rounded-[14px]',
  sm: 'size-11 rounded-xl',
} as const;

type BoxSize = keyof typeof BOX_SIZES;

// The square a date, an icon or an option sits in at the start of a row.
export function RowTile({
  children,
  size = 'md',
  highlight = false,
  className,
}: {
  children: ReactNode;
  size?: BoxSize;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'grid flex-none place-content-center place-items-center text-center leading-none',
        BOX_SIZES[size],
        highlight ? 'bg-fill-on' : 'bg-fill-hover',
        className
      )}
    >
      {children}
    </span>
  );
}

// A setlist's date as day and month; only the next set lights up.
export function DateBlock({
  date,
  status,
  size = 'md',
}: {
  date: string | null | undefined;
  status: SetStatus;
  size?: BoxSize;
}) {
  const { t, i18n } = useTranslation();
  const parsed = date ? new Date(date) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return (
      <RowTile size={size} className="text-ink-3">
        <b className={cn('font-mono font-bold', size === 'md' ? 'text-xl' : 'text-base')}>–</b>
        <small className="mt-1 text-[0.6875rem] font-semibold">{t('setlists.noDate')}</small>
      </RowTile>
    );
  }
  return (
    <RowTile size={size} highlight={status === 'next'}>
      <b className={cn('font-mono font-bold', size === 'md' ? 'text-xl' : 'text-base')}>
        {new Intl.DateTimeFormat(i18n.language, { day: 'numeric' }).format(parsed)}
      </b>
      <small className="text-ink-2 mt-1 text-[0.6875rem] font-semibold">
        {new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(parsed)}
      </small>
    </RowTile>
  );
}
