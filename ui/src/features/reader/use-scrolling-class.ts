import { useEffect } from 'react';

const IDLE_MS = 160;

// Marks `<html>` with `scrolling` while the song (the page or a split pane) is moving, so glass swaps its live
// backdrop blur for a flat tint the GPU doesn't have to re-blur every frame. Scrolls inside a sheet don't count.
export const useScrollingClass = () => {
  useEffect(() => {
    const root = document.documentElement;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[role=dialog]')) return;
      if (!root.classList.contains('scrolling')) root.classList.add('scrolling');
      clearTimeout(idle);
      idle = setTimeout(() => root.classList.remove('scrolling'), IDLE_MS);
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      clearTimeout(idle);
      root.classList.remove('scrolling');
    };
  }, []);
};
