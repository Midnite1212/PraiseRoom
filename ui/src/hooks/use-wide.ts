import { useSyncExternalStore } from 'react';

// The one wide-layout breakpoint. The `wide:` variant in `src/styles.css` repeats this exact text (a test
// keeps them equal). Tablets and half-screen desktop windows get the wide layout; a phone turned
// sideways is too short for it.
export const WIDE_QUERY = '(min-width: 768px) and (min-height: 600px)';

// jsdom has no matchMedia; tests then get the wide layout.
const hasMatchMedia = () => typeof window.matchMedia === 'function';

export function useMediaQuery(query: string, whenUnsupported: boolean) {
  const subscribe = (onChange: () => void) => {
    if (!hasMatchMedia()) return () => undefined;
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  };
  const getSnapshot = () => (hasMatchMedia() ? window.matchMedia(query).matches : whenUnsupported);
  return useSyncExternalStore(subscribe, getSnapshot, () => whenUnsupported);
}

export function useIsWide() {
  return useMediaQuery(WIDE_QUERY, true);
}

// Layouts that put a second column beside the page (Settings' preview, the Songs, Setlists and Folders
// panes, the split reader) need more than the bare wide layout. The `roomy:` variant in `src/styles.css`
// repeats this text. Between wide and roomy the page keeps one column.
export const ROOMY_QUERY = '(min-width: 1100px) and (min-height: 600px)';

export function useIsRoomy() {
  return useMediaQuery(ROOMY_QUERY, true);
}

// Wide but not roomy: an iPad in portrait. The sidebar stays folded, two-column pages stack, and the panes
// that sit beside a list slide over it. The `compact:` variant in `src/styles.css` repeats this text.
export const COMPACT_QUERY = '(min-width: 768px) and (max-width: 1099px) and (min-height: 600px)';

export function useIsCompact() {
  return useMediaQuery(COMPACT_QUERY, false);
}
