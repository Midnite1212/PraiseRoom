import { Filter } from 'pixelarticons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type FilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  summary: string;
  showLabel: string;
  canShow: boolean;
  onReset: () => void;
  children: ReactNode;
};

// Filters in a sheet (a centred dialog on wide screens). The list behind it updates as you choose,
// so the footer's button only closes it.
export function FilterSheet({
  open,
  onOpenChange,
  title,
  summary,
  showLabel,
  canShow,
  onReset,
  children,
}: FilterSheetProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="[--dw:520px]"
        footer={
          <DialogFooter>
            <Button variant="secondary" onClick={onReset}>
              {t('filters.reset')}
            </Button>
            <DialogClose asChild>
              <Button disabled={!canShow}>{showLabel}</Button>
            </DialogClose>
          </DialogFooter>
        }
      >
        <DialogHeader icon={<Filter />}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-[18px]">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function FilterSection({
  title,
  onClear,
  children,
}: {
  title: string;
  onClear?: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section>
      <h3 className="mx-1 mb-2 flex items-baseline justify-between text-sm font-semibold">
        {title}
        {onClear ? (
          <button type="button" onClick={onClear} className="text-ink-3 hover:text-ink text-xs">
            {t('filters.clear')}
          </button>
        ) : null}
      </h3>
      {children}
    </section>
  );
}

// A filter that toggles on and off: a chip, or a tile with an icon on top.
export function FilterToggle({
  pressed,
  onToggle,
  children,
  shape = 'chip',
}: {
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
  shape?: 'chip' | 'tile';
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        'bg-fill-hover text-ink-2 aria-pressed:liquid-on aria-pressed:text-ink font-semibold transition-colors duration-150 [&_svg]:size-icon [&_svg]:flex-none',
        shape === 'chip'
          ? 'inline-flex h-9 items-center gap-2 rounded-full px-3 text-[0.8125rem]'
          : 'aria-pressed:[&_svg]:text-chord flex min-h-[78px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2 text-center text-xs leading-tight'
      )}
    >
      {children}
    </button>
  );
}
