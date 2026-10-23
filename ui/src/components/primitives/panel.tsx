import { Close } from 'pixelarticons/react';
import { type ReactElement, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

type PanelProps = {
  trigger: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  // Replaces the close button at the end of the header (an "Edit order" text button, say).
  headerAction?: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
  // Phones: where the sheet sits, for example above the reader's dock.
  sheetClassName?: string;
};

// A settings or picker panel: a glass popover anchored to its button on wide screens, a sheet that rises
// from the bottom on phones.
export function Panel({
  trigger,
  title,
  description,
  headerAction,
  children,
  open,
  onOpenChange,
  align = 'center',
  className,
  sheetClassName,
}: PanelProps) {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const [ownOpen, setOwnOpen] = useState(false);
  const isOpen = open ?? ownOpen;
  const setOpen = onOpenChange ?? setOwnOpen;

  if (isWide) {
    return (
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align={align}
          collisionPadding={12}
          className={cn(
            'max-h-[min(80vh,640px)] w-[min(360px,calc(100vw-24px))] gap-3 overflow-y-auto px-4 pt-[18px] pb-4',
            className
          )}
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <h2 className="text-base leading-snug font-semibold">{title}</h2>
              {description ? (
                <p className="text-ink-2 mt-0.5 text-[0.8125rem]">{description}</p>
              ) : null}
            </div>
            {headerAction ?? (
              <PopoverClose asChild>
                <Button variant="ghost" size="icon" aria-label={t('reader.close')}>
                  <Close />
                </Button>
              </PopoverClose>
            )}
          </div>
          {children}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={headerAction === undefined}
        className={cn('max-h-[min(70svh,620px)] gap-3', sheetClassName, className)}
      >
        <div className="flex items-start gap-2.5">
          <DialogHeader className={cn('flex-1', headerAction !== undefined && 'pr-0')}>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {headerAction}
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
