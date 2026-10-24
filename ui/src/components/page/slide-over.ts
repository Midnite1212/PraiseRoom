import { useEffect, useRef, useState } from 'react';

import { useIsCompact } from '@/hooks/use-wide';

// The pane beside a list (song preview, setlist preview, open folder) floats over the list as glass on a compact wide screen.
export const SLIDE_OVER_CLASSES =
  'compact:fixed compact:z-40 compact:top-3 compact:right-3 compact:bottom-3 compact:w-[min(420px,calc(100vw-var(--rail-w)-64px))] compact:overflow-y-auto compact:rounded-[32px] compact:bg-glass-strong compact:px-6 compact:py-5 compact:shadow-[inset_0_0_0_1px_var(--hairline),0_24px_60px_-20px_var(--shadow)] compact:backdrop-blur-[22px] compact:backdrop-saturate-[180%] compact:outline-none compact:animate-over-in compact:data-closing:animate-over-out';

export const SLIDE_OVER_CLOSE_CLASSES = 'compact:top-3.5 compact:right-3.5';

const EXIT_MS = 220;

// Closing waits for the exit animation on a compact screen; elsewhere the pane has none. When the pane opens it takes
// focus, and focus returns to what opened it when it closes.
export type SlideOver = ReturnType<typeof useSlideOver>;

export function useSlideOver(isOpen: boolean, onClose: () => void) {
  const isCompact = useIsCompact();
  const panel = useRef<HTMLElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen || !isCompact) return undefined;
    const opener = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, [isOpen, isCompact]);

  useEffect(() => {
    if (!isClosing) return undefined;
    const timer = window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isClosing, onClose]);

  const close = () => {
    if (isCompact) setIsClosing(true);
    else onClose();
  };

  return {
    close,
    panelProps: {
      ref: panel,
      tabIndex: -1,
      'data-slide-over': '',
      'data-closing': isClosing ? '' : undefined,
    },
  };
}
