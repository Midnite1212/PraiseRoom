import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// A group of rows under a plain heading and a one-line description.
export function SettingsGroup({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <header className="mb-1">
        <h2 id={id} className="m-0 text-lg font-bold tracking-[-0.01em]">
          {title}
        </h2>
        <p className="text-ink-3 mt-1 text-[0.8125rem]">{description}</p>
      </header>
      {children}
    </section>
  );
}

// The label and hint in one column and the control in another, so every control on a wide screen starts
// on the same line; on a phone the control drops under its label. `inline` keeps a switch beside its
// label on a phone.
export function SettingsRow({
  label,
  hint,
  inline = false,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  inline?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'border-hairline wide:grid-cols-[224px_minmax(0,1fr)] wide:items-center wide:gap-6 grid gap-2.5 border-b py-4 last:border-b-0',
        inline && 'grid-cols-[minmax(0,1fr)_auto] items-center'
      )}
    >
      <span className="min-w-0">
        <b className="block text-[0.9375rem] font-semibold">{label}</b>
        {hint ? (
          <small className="text-ink-3 mt-[3px] block text-[0.8125rem] leading-[1.4]">{hint}</small>
        ) : null}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
