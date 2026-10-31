import { useEffect } from 'react';

import { type Point, swipeDirection } from './swipe';

const BLOCKED_TARGETS =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]';

const scrollsSideways = (element: Element): boolean => {
  const { overflowX } = getComputedStyle(element);
  return (
    (overflowX === 'auto' || overflowX === 'scroll') && element.scrollWidth > element.clientWidth
  );
};

const isBlocked = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  if (target.closest(BLOCKED_TARGETS)) return true;
  for (let element: Element | null = target; element; element = element.parentElement) {
    if (scrollsSideways(element)) return true;
  }
  return false;
};

const isPinchZoomed = (): boolean => (window.visualViewport?.scale ?? 1) > 1;

const toPoint = (touch: Touch): Point => ({ x: touch.clientX, y: touch.clientY });

// A horizontal swipe on touch asks for the next song (left) or the previous one (right). Vertical scrolling,
// pinch-zoom, inputs, dialogs and sideways-scrolling strips are left alone.
export function useSongSwipe(onSwipe: (direction: 1 | -1) => void) {
  useEffect(() => {
    let start: Point | null = null;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const isSingle = event.touches.length === 1;
      start =
        isSingle && touch && !isPinchZoomed() && !isBlocked(event.target) ? toPoint(touch) : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) start = null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const from = start;
      const touch = event.changedTouches[0];
      start = null;
      if (!from || !touch || event.touches.length > 0 || isPinchZoomed()) return;
      const direction = swipeDirection(from, toPoint(touch));
      if (direction !== 0) onSwipe(direction);
    };
    const onTouchCancel = () => {
      start = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  });
}
