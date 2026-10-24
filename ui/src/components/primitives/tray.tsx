import { Close } from 'pixelarticons/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { PointerEvent, ReactElement, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

const CLOSE_DISTANCE = 56;
// A control marked `data-keeps-tray` (auto-scroll's play button) can be used with the tray open.
const keepOpenOnOutsideControl = (event: {
  target: EventTarget | null;
  preventDefault: () => void;
}) => {
  if (event.target instanceof Element && event.target.closest('[data-keeps-tray]'))
    event.preventDefault();
};

const IGNORED_DRAG_TARGETS = 'button, output, input, [role="radio"], [role="switch"]';

// Phones: a downward drag on the tray's own surface follows the finger and closes it past CLOSE_DISTANCE.
function useDragToClose(close: () => void) {
  const drag = useRef<{ y0: number; dy: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest(IGNORED_DRAG_TARGETS)) return;
    drag.current = { y0: event.clientY, dy: 0 };
    event.currentTarget.dataset.dragging = '';
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;
    current.dy = Math.max(0, event.clientY - current.y0);
    event.currentTarget.style.setProperty('--tray-drag', `${current.dy}px`);
  };
  const onPointerEnd = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    event.currentTarget.style.removeProperty('--tray-drag');
    if (current.dy > CLOSE_DISTANCE) close();
  };

  return { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd };
}

type TrayProps = {
  trigger: ReactElement;
  // The dialog's accessible name; a tray shows no heading unless it has a description.
  title: string;
  // A line under the title that also shows the title with a close button above the controls.
  description?: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  // Controlled open state, for a tray that closes itself (after a pick); uncontrolled when omitted.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type OpenState = { open: boolean; onOpenChange: (open: boolean) => void };

function TrayHead({
  title,
  description,
  titleElement,
  Close: CloseTrigger,
}: {
  title: string;
  description: string;
  titleElement: 'dialog' | 'heading';
  Close: typeof DialogClose | typeof PopoverClose;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-2.5 flex items-start justify-between gap-2.5">
      <div className="min-w-0">
        {titleElement === 'dialog' ? (
          <DialogTitle className="text-base leading-snug font-semibold">{title}</DialogTitle>
        ) : (
          <h2 className="text-base leading-snug font-semibold">{title}</h2>
        )}
        <p className="text-ink-2 mt-0.5 text-[0.8125rem]">{description}</p>
      </div>
      <CloseTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('reader.close')}>
          <Close />
        </Button>
      </CloseTrigger>
    </div>
  );
}

function PhoneTray({
  trigger,
  title,
  description,
  children,
  className,
  open,
  onOpenChange,
}: TrayProps & OpenState) {
  const dragHandlers = useDragToClose(() => onOpenChange(false));

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogPortal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onInteractOutside={keepOpenOnOutsideControl}
          {...dragHandlers}
          className={cn(
            'glass glass-strong text-ink fixed right-2.5 bottom-[calc(var(--bottom)+var(--dock-h)+10px)] left-2.5 z-50 mx-auto flex max-w-[560px] origin-bottom touch-none flex-col px-3.5 pt-3 pb-3.5 text-sm outline-none [--glass-r:28px] [translate:0_var(--tray-drag,0px)] transition-[translate] duration-200 ease-out data-dragging:transition-none data-open:animate-sheet-in data-closed:animate-sheet-out',
            className
          )}
        >
          {description ? null : <DialogTitle className="sr-only">{title}</DialogTitle>}
          <span
            aria-hidden
            className="bg-ink-3 mx-auto mb-2.5 block h-1 w-9 flex-none rounded-full opacity-60"
          />
          {description ? (
            <TrayHead
              title={title}
              description={description}
              titleElement="dialog"
              Close={DialogClose}
            />
          ) : null}
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

// A live control tray (Aa, key): it never dims the song. Wide screens anchor it to its button as a popover;
// phones raise it above the dock as a sheet you can drag down. Both are non-modal dialogs: Esc, a tap
// outside, or a drag closes them, and focus is not trapped so the song stays usable behind.
export function Tray(props: TrayProps) {
  const isWide = useIsWide();
  const [isOpen, setIsOpen] = useState(false);
  const open = props.open ?? isOpen;
  const onOpenChange = props.onOpenChange ?? setIsOpen;
  if (!isWide) return <PhoneTray {...props} open={open} onOpenChange={onOpenChange} />;

  const { trigger, title, description, children, align = 'end', className } = props;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        aria-label={title}
        onInteractOutside={keepOpenOnOutsideControl}
        align={align}
        collisionPadding={12}
        className={cn(
          'w-[min(360px,calc(100vw-24px))] gap-0 px-3.5 pt-3 pb-3.5 [--glass-r:28px]',
          className
        )}
      >
        {description ? (
          <TrayHead
            title={title}
            description={description}
            titleElement="heading"
            Close={PopoverClose}
          />
        ) : null}
        {children}
      </PopoverContent>
    </Popover>
  );
}
