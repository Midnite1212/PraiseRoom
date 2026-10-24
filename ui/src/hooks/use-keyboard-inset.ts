import { useEffect } from 'react';

// How much of the layout viewport the on-screen keyboard covers, from the visual viewport.
export function keyboardInset(
  layoutHeight: number,
  viewport: { height: number; offsetTop: number }
) {
  return Math.max(0, Math.round(layoutHeight - viewport.height - viewport.offsetTop));
}

// Publishes the keyboard's height as `--kb` on `<html>` while mounted, so a bottom sheet can sit above
// it: phones keep fixed elements on the layout viewport, which the keyboard covers.
export function useKeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    const root = document.documentElement;
    const update = () =>
      root.style.setProperty('--kb', `${keyboardInset(window.innerHeight, viewport)}px`);
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--kb');
    };
  }, []);
}
