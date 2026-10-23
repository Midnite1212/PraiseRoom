import { Check } from 'pixelarticons/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PickRowProps = {
  leading: ReactNode;
  title: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

// A row in a pick list: tap to tick it, with a round check at the end.
export function PickRow({
  leading,
  title,
  hint,
  checked,
  disabled = false,
  onToggle,
}: PickRowProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={onToggle}
      className="group/pick enabled:hover:bg-fill-hover aria-pressed:enabled:bg-fill-on flex min-h-[60px] w-full items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left transition-colors disabled:opacity-50"
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        {hint ? <small className="text-ink-3 block truncate text-xs">{hint}</small> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          'grid size-[22px] flex-none place-items-center rounded-full [&_svg]:size-3.5',
          checked
            ? 'bg-chord text-ground group-disabled/pick:bg-fill-press group-disabled/pick:text-ink-2'
            : 'shadow-[inset_0_0_0_1.5px_var(--ink-3)] text-transparent'
        )}
      >
        <Check />
      </span>
    </button>
  );
}
