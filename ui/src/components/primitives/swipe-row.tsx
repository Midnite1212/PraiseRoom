import { type ReactNode, type SyntheticEvent, useEffect, useRef, useState } from 'react';

import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

const DRAG_THRESHOLD = 8;
const OVERSHOOT = 24;
const LONG_PRESS_MS = 520;
const PRESS_FEEDBACK_MS = 140;

// A menu portaled out of the row still bubbles its events through React's tree.
const isInside = (event: SyntheticEvent<HTMLElement>) =>
  event.target instanceof Node && event.currentTarget.contains(event.target);

export type SwipeAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
};

// Phones: swipe a row left to reveal its actions; tap elsewhere or swipe back to close. Holding a row
// (`onLongPress`) without moving shows a press and then fires. Wide screens show the row as it is and
// offer the same actions from its ⋯ menu.
export function SwipeRow({
  actions,
  onLongPress,
  children,
}: {
  actions: readonly SwipeAction[];
  onLongPress?: () => void;
  children: ReactNode;
}) {
  const isWide = useIsWide();
  const hostRef = useRef<HTMLLIElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x0: number; y0: number; dx: number; base: number; moved: boolean } | null>(
    null
  );
  const swallowClick = useRef(false);
  const holdTimers = useRef<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const cancelHold = () => {
    for (const timer of holdTimers.current) window.clearTimeout(timer);
    holdTimers.current = [];
    delete rowRef.current?.dataset.holding;
  };

  const startHold = () => {
    cancelHold();
    holdTimers.current = [
      window.setTimeout(() => {
        if (rowRef.current) rowRef.current.dataset.holding = '';
      }, PRESS_FEEDBACK_MS),
      window.setTimeout(() => {
        drag.current = null;
        swallowClick.current = true;
        cancelHold();
        onLongPress?.();
      }, LONG_PRESS_MS),
    ];
  };

  const place = (offset: number | null) => {
    const row = rowRef.current;
    if (!row) return;
    if (offset === null) {
      row.style.removeProperty('--swipe');
      return;
    }
    // The actions and the row's cover only show while the row is away from rest.
    if (hostRef.current) hostRef.current.dataset.swiping = '';
    row.style.setProperty('--swipe', `${offset}px`);
  };

  const settle = (open: boolean) => {
    setIsOpen(open);
    place(open ? -(actionsRef.current?.offsetWidth ?? 0) : null);
  };

  useEffect(
    () => () => {
      for (const timer of holdTimers.current) window.clearTimeout(timer);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideTap = (event: PointerEvent) => {
      if (event.target instanceof Node && hostRef.current?.contains(event.target)) return;
      setIsOpen(false);
      rowRef.current?.style.removeProperty('--swipe');
    };
    document.addEventListener('pointerdown', closeOnOutsideTap);
    return () => document.removeEventListener('pointerdown', closeOnOutsideTap);
  }, [isOpen]);

  if (isWide || (actions.length === 0 && !onLongPress)) return <li>{children}</li>;

  return (
    <li ref={hostRef} className="group/swipe relative overflow-hidden rounded-2xl">
      <div
        ref={actionsRef}
        className="invisible absolute inset-y-0 right-0 flex gap-1 p-1 group-data-swiping/swipe:visible"
      >
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            tabIndex={isOpen ? 0 : -1}
            onClick={() => {
              settle(false);
              action.onSelect();
            }}
            className={cn(
              'flex w-16 flex-col items-center justify-center gap-[3px] rounded-[14px] text-[0.6875rem] font-semibold [&_svg]:size-icon',
              action.tone === 'danger'
                ? 'text-danger-quiet bg-destructive/20 active:bg-danger-tint active:text-destructive'
                : 'bg-fill-press text-ink'
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <div
        ref={rowRef}
        onPointerDown={(event) => {
          if (!isInside(event)) return;
          swallowClick.current = false;
          if (onLongPress && !isOpen && event.isPrimary && event.button === 0) startHold();
          drag.current = {
            x0: event.clientX,
            y0: event.clientY,
            dx: 0,
            base: isOpen ? -(actionsRef.current?.offsetWidth ?? 0) : 0,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state) return;
          state.dx = event.clientX - state.x0;
          const dy = event.clientY - state.y0;
          if (Math.abs(state.dx) >= DRAG_THRESHOLD || Math.abs(dy) >= DRAG_THRESHOLD) cancelHold();
          if (Math.abs(state.dx) < DRAG_THRESHOLD || Math.abs(state.dx) < Math.abs(dy)) return;
          if (!state.moved) {
            state.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.dataset.dragging = '';
          }
          const max = actionsRef.current?.offsetWidth ?? 0;
          place(Math.min(0, Math.max(-max - OVERSHOOT, state.base + state.dx)));
        }}
        onPointerUp={(event) => {
          cancelHold();
          const state = drag.current;
          drag.current = null;
          delete event.currentTarget.dataset.dragging;
          if (!state) return;
          if (state.moved) {
            swallowClick.current = true;
            settle(state.base + state.dx < -(actionsRef.current?.offsetWidth ?? 0) / 2);
          } else if (isOpen) {
            swallowClick.current = true;
            settle(false);
          }
        }}
        onPointerCancel={(event) => {
          cancelHold();
          drag.current = null;
          delete event.currentTarget.dataset.dragging;
          settle(isOpen);
        }}
        onTransitionEnd={(event) => {
          if (event.currentTarget.style.getPropertyValue('--swipe') === '' && hostRef.current) {
            delete hostRef.current.dataset.swiping;
          }
        }}
        onContextMenu={
          onLongPress ? (event) => isInside(event) && event.preventDefault() : undefined
        }
        onClickCapture={(event) => {
          if (!swallowClick.current || !isInside(event)) return;
          swallowClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
        className="group-data-swiping/swipe:bg-ground ease-liquid data-holding:bg-fill-press relative translate-x-(--swipe) touch-pan-y rounded-2xl transition-transform duration-[380ms] [--swipe:0px] [-webkit-touch-callout:none] data-dragging:transition-none data-holding:scale-[0.98]"
      >
        {children}
      </div>
    </li>
  );
}
