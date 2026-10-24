import type { ReactNode } from 'react';

// One row of an account list: an icon tile, two lines, and one action on the right.
export function AccountItem({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  action?: ReactNode;
}) {
  return (
    <li className="border-hairline flex items-center gap-3.5 border-b py-3 last:border-b-0">
      <span className="bg-fill-hover [&_svg]:size-icon grid size-10 flex-none place-items-center rounded-xl">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block font-semibold">{title}</b>
        <small className="text-ink-3 mt-0.5 block truncate text-[0.8125rem]">{subtitle}</small>
      </span>
      {action}
    </li>
  );
}

export const QUIET_DANGER_CLASSES =
  'lit-icon-danger text-danger-quiet hover:text-destructive hover:bg-danger-tint';
