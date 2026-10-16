import { useEffect, useState } from 'react';

// True once the observed element has scrolled up behind a sticky header `offsetPx` tall.
export const useScrolledPast = (offsetPx: number) => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setIsPast(!entry.isIntersecting && entry.boundingClientRect.top < offsetPx);
      },
      { rootMargin: `-${offsetPx}px 0px 0px 0px` }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, offsetPx]);

  return [setElement, isPast] as const;
};
