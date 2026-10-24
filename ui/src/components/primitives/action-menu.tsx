import { Slot } from 'radix-ui';
import { createContext, type ReactElement, type ReactNode, use, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

const SetMenuOpenContext = createContext<(open: boolean) => void>(() => undefined);

type ActionMenuProps = {
  trigger: ReactElement;
  // Control the menu from outside, for example to open it with a long-press.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  header?: ReactNode;
  showCloseButton?: boolean;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
};

// A ⋯ menu: anchored to its button on wide screens, a sheet from the bottom on phones.
export function ActionMenu({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  leading,
  header,
  showCloseButton = true,
  children,
  align = 'center',
  className,
}: ActionMenuProps) {
  const isWide = useIsWide();
  const [ownOpen, setOwnOpen] = useState(false);
  const isOpen = open ?? ownOpen;
  const setIsOpen = onOpenChange ?? setOwnOpen;
  if (isWide) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align={align}
          className={cn('w-[min(340px,calc(100vw-24px))] gap-0 p-2', className)}
        >
          {header ? (
            <div className="pb-2">{header}</div>
          ) : (
            <div className="flex items-center gap-3 px-3 pt-1.5 pb-2">
              {leading}
              <div className="min-w-0">
                <p className="leading-snug font-semibold">{title}</p>
                {description ? (
                  <p className="text-ink-2 mt-0.5 text-[0.8125rem]">{description}</p>
                ) : null}
              </div>
            </div>
          )}
          <SetMenuOpenContext value={setIsOpen}>{children}</SetMenuOpenContext>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={showCloseButton} className={cn('gap-0', className)}>
        {header ? (
          <>
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <div className="-mb-2">{header}</div>
          </>
        ) : (
          <div className={cn('flex items-center gap-3', showCloseButton && 'pr-10')}>
            {leading}
            <DialogHeader className="flex-1 pr-0">
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
          </div>
        )}
        <div className="-mx-1 flex flex-col">
          <SetMenuOpenContext value={setIsOpen}>{children}</SetMenuOpenContext>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type MenuRowProps = {
  children: ReactNode;
  onSelect?: () => void;
  tone?: 'default' | 'danger';
  asChild?: boolean;
  className?: string;
};

export function MenuRow({
  children,
  onSelect,
  tone = 'default',
  asChild = false,
  className,
}: MenuRowProps) {
  const setMenuOpen = use(SetMenuOpenContext);
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      {...(asChild ? {} : { type: 'button' as const })}
      onClick={() => {
        setMenuOpen(false);
        onSelect?.();
      }}
      className={cn(
        'flex min-h-[46px] w-full items-center gap-3 rounded-2xl px-3 text-left font-semibold transition-colors [&_svg]:size-icon [&_svg]:flex-none',
        tone === 'danger'
          ? 'lit-icon-danger text-danger-quiet hover:bg-danger-tint hover:text-destructive'
          : 'lit-icon hover:liquid-hover [&_svg]:text-ink-2',
        className
      )}
    >
      {children}
    </Comp>
  );
}

type MenuTileProps = {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  asChild?: boolean;
};

// A quick action: an icon over its label. Lay tiles out in a `grid grid-cols-3`.
export function MenuTile({ children, onSelect, disabled = false, asChild = false }: MenuTileProps) {
  const setMenuOpen = use(SetMenuOpenContext);
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      {...(asChild ? {} : { type: 'button' as const, disabled })}
      onClick={() => {
        setMenuOpen(false);
        onSelect?.();
      }}
      className="lit-icon bg-fill-hover not-disabled:hover:liquid-hover [&_svg]:size-icon grid justify-items-center gap-1.5 rounded-2xl px-1 pt-3.5 pb-3 text-[0.8125rem] font-semibold transition-colors disabled:opacity-40"
    >
      {children}
    </Comp>
  );
}

// Closes the menu it sits in: the close button of a custom header.
export function MenuClose({ children }: { children: ReactElement }) {
  const setMenuOpen = use(SetMenuOpenContext);
  return <Slot.Root onClick={() => setMenuOpen(false)}>{children}</Slot.Root>;
}

export function MenuSeparator() {
  return <div aria-hidden className="bg-hairline mx-1 my-1.5 h-px" />;
}
