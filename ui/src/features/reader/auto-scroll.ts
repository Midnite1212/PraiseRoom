import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useIsWide } from '@/hooks/use-wide';
import { createStoredChoice } from '@/lib/stored-choice';

export const AUTO_SCROLL_SPEEDS = ['slow', 'med', 'fast'] as const;

export type AutoScrollSpeed = (typeof AUTO_SCROLL_SPEEDS)[number];

export const PIXELS_PER_SECOND = {
  slow: 16,
  med: 28,
  fast: 44,
} as const satisfies Record<AutoScrollSpeed, number>;

const scrollSpeed = createStoredChoice('auto-scroll-speed', AUTO_SCROLL_SPEEDS, 'med');

export const readScrollSpeed = scrollSpeed.read;
export const setScrollSpeed = scrollSpeed.write;

// A hook-named alias, so the React Compiler calls it on every render instead of memoizing it.
export const useScrollSpeed = scrollSpeed.use;

// A tab in the background hands back one huge frame gap; cap it so the page does not jump.
const MAX_FRAME_SECONDS = 0.1;
const END_TOLERANCE_PX = 2;

type AutoScrollerOptions = {
  pixelsPerSecond: number;
  scrollBy: (pixels: number) => void;
  isAtEnd: () => boolean;
  onEnd: () => void;
};

// Moves the page on every animation frame. Browsers scroll whole pixels, so the fraction left over from
// one frame is carried into the next and a slow speed still moves at its true rate.
export function createAutoScroller({
  pixelsPerSecond,
  scrollBy,
  isAtEnd,
  onEnd,
}: AutoScrollerOptions) {
  let frame = 0;
  let isRunning = false;
  let lastTime: number | null = null;
  let carry = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    isRunning = false;
    lastTime = null;
    carry = 0;
  };

  const step = (time: number) => {
    const seconds = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, MAX_FRAME_SECONDS);
    lastTime = time;
    carry += seconds * pixelsPerSecond;
    const whole = Math.floor(carry);
    if (whole > 0) {
      scrollBy(whole);
      carry -= whole;
    }
    if (isAtEnd()) {
      stop();
      onEnd();
      return;
    }
    frame = requestAnimationFrame(step);
  };

  const start = () => {
    if (isRunning) return;
    isRunning = true;
    frame = requestAnimationFrame(step);
  };

  return { start, stop };
}

const isPageAtEnd = () =>
  window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - END_TOLERANCE_PX;

const scrollPageBy = (pixels: number) => window.scrollBy({ top: pixels, behavior: 'instant' });

const CONTROLS = 'button, a, input, select, [role="dialog"], [role="menu"], [role="radio"]';
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

const isInControls = (target: EventTarget | null) =>
  target instanceof Element && target.closest(CONTROLS) !== null;

// The reader's own scroll gestures (wheel, a drag, the scroll keys, the scrollbar). A tap does not count,
// so the tray can be opened and closed while the page keeps moving.
const isUserScroll = (event: Event) => {
  if (event instanceof KeyboardEvent)
    return SCROLL_KEYS.has(event.key) && !isInControls(event.target);
  if (event.type === 'pointerdown') return event.target === document.documentElement;
  return !isInControls(event.target);
};

const USER_SCROLL_EVENTS = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;

export type AutoScroll = {
  running: boolean;
  toggle: () => void;
  // Where the play button is: the top bar on wide screens, the dock on phones.
  where: 'topBar' | 'dock';
};

// Auto-scroll for one song on screen. It stops itself at the end of the song, when the reader scrolls by
// hand, and when `songKey` changes. Speed changes apply on the next frame. A reduced-motion setting does
// not change it: the reader starts it, can pause it, and the speeds are what a band reads by.
export function useAutoScroll(songKey: string): AutoScroll {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const [speed] = useScrollSpeed();
  const [startedFor, setStartedFor] = useState<string | null>(null);
  const running = startedFor === songKey;

  useEffect(() => {
    if (!running) return undefined;
    const pause = (event: Event) => {
      if (isUserScroll(event)) setStartedFor(null);
    };
    const scroller = createAutoScroller({
      pixelsPerSecond: PIXELS_PER_SECOND[speed],
      scrollBy: scrollPageBy,
      isAtEnd: isPageAtEnd,
      onEnd: () => {
        setStartedFor(null);
        toast(t('reader.autoScroll.end'));
      },
    });
    scroller.start();
    for (const type of USER_SCROLL_EVENTS) window.addEventListener(type, pause, { passive: true });
    return () => {
      scroller.stop();
      for (const type of USER_SCROLL_EVENTS) window.removeEventListener(type, pause);
    };
  }, [running, speed, t]);

  return {
    running,
    toggle: () => setStartedFor(running ? null : songKey),
    where: isWide ? 'topBar' : 'dock',
  };
}
