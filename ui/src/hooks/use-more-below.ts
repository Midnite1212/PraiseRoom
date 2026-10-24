import { useEffect, useState } from 'react';

export function hasMoreBelow(box: {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}) {
  return box.scrollTop + box.clientHeight < box.scrollHeight - 4;
}

// Whether a scroll box has content below its fold. Pass `ref` to the box: it re-checks on scroll, resize, and when
// its content changes.
export function useMoreBelow() {
  const [box, setBox] = useState<HTMLElement | null>(null);
  const [isMore, setIsMore] = useState(false);

  useEffect(() => {
    if (!box) return undefined;
    const update = () => setIsMore(hasMoreBelow(box));
    update();
    box.addEventListener('scroll', update, { passive: true });
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resize?.observe(box);
    const mutation = new MutationObserver(update);
    mutation.observe(box, { childList: true, subtree: true });
    return () => {
      box.removeEventListener('scroll', update);
      resize?.disconnect();
      mutation.disconnect();
    };
  }, [box]);

  return { ref: setBox, isMore };
}
