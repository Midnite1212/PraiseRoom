import { ChevronDown } from 'pixelarticons/react';
import type { ReactNode } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// One line of pill chips under the editor title. Phones scroll it sideways edge to edge; wide screens wrap it.
export function ChipsRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'wide:mx-0 wide:flex-wrap wide:overflow-visible wide:px-0 -mx-(--pg) mt-4 mb-6 flex items-center gap-2 overflow-x-auto px-(--pg) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

type EditorChipProps = {
  // Small quiet label before the value, such as "Key".
  label?: string;
  value: ReactNode;
  // What opens under the chip; give it a width with `contentClassName` (for example `w-80`).
  children: ReactNode;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// A setting shown as a pill; it opens an anchored popover to change it.
export function EditorChip({
  label,
  value,
  children,
  contentClassName,
  open,
  onOpenChange,
}: EditorChipProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="bg-fill-hover hover:bg-fill-press aria-expanded:bg-fill-press inline-flex h-10 flex-none items-center gap-2 rounded-full pr-2.5 pl-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ease-out"
        >
          {label ? <span className="text-ink-3 text-xs">{label}</span> : null}
          {value}
          <ChevronDown className="text-ink-3 size-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={contentClassName}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
