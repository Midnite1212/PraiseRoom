import { Dialog as DialogPrimitive } from 'radix-ui';
import type { PointerEvent, ReactElement, ReactNode } from 'react';
import { useRef, useState } from 'react';

import { Dialog, DialogPortal, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

const CLOSE_DISTANCE = 56;
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
  // The dialog's accessible name; trays show no visible heading.
  title: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
};

function PhoneTray({ trigger, title, children, className }: TrayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dragHandlers = useDragToClose(() => setIsOpen(false));

  return (
    <Dialog modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogPortal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          {...dragHandlers}
          className={cn(
            'glass glass-strong text-ink fixed right-2.5 bottom-[calc(var(--bottom)+var(--dock-h)+10px)] left-2.5 z-50 mx-auto flex max-w-[560px] origin-bottom touch-none flex-col px-3.5 pt-3 pb-3.5 text-sm outline-none [--glass-r:28px] [translate:0_var(--tray-drag,0px)] transition-[translate] duration-200 ease-out data-dragging:transition-none data-open:animate-sheet-in data-closed:animate-sheet-out',
            className
          )}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <span
            aria-hidden
            className="bg-ink-3 mx-auto mb-2.5 block h-1 w-9 flex-none rounded-full opacity-60"
          />
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
  if (!isWide) return <PhoneTray {...props} />;

  const { trigger, title, children, align = 'end', className } = props;
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        aria-label={title}
        align={align}
        collisionPadding={12}
        className={cn(
          'w-[min(360px,calc(100vw-24px))] gap-0 px-3.5 pt-3 pb-3.5 [--glass-r:28px]',
          className
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
