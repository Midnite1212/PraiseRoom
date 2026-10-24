import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const ROW_CLASSES =
  'bg-fill-hover flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl py-1.5 pr-2 pl-3.5 text-ui';

// A settings row: a bold label with an optional hint on the left, its control on the right. With
// `onClick` the whole row is a button.
export function SetRow({
  label,
  hint,
  children,
  className,
  onClick,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <b className="block font-semibold">{label}</b>
        {hint ? <span className="text-ink-3 block text-[0.8125rem]">{hint}</span> : null}
      </span>
      {children}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(ROW_CLASSES, 'hover:bg-fill-press w-full text-left', className)}
      >
        {content}
      </button>
    );
  }
  return <div className={cn(ROW_CLASSES, className)}>{content}</div>;
}
