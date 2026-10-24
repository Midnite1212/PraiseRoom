import { type RefObject, useEffect } from 'react';

// Calls `onNear` whenever `target` comes within `margin` of the viewport, for loading the next page
// of a list before the reader reaches the end. Re-observes after each load so a short page that
// leaves the target in view keeps loading.
export const useNearEnd = (
  target: RefObject<Element | null>,
  { enabled, onNear, margin = '600px' }: { enabled: boolean; onNear: () => void; margin?: string }
) => {
  useEffect(() => {
    const element = target.current;
    if (!enabled || !element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onNear();
      },
      { rootMargin: `0px 0px ${margin} 0px` }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, enabled, onNear, margin]);
};
