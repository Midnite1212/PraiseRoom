import { useSyncExternalStore } from 'react';

// Matches the `wide:` variant in `src/styles.css`.
const WIDE_QUERY = '(min-width: 900px) and (orientation: landscape)';

// jsdom has no matchMedia; tests then get the wide layout.
const hasMatchMedia = () => typeof window.matchMedia === 'function';

const subscribe = (onChange: () => void) => {
  if (!hasMatchMedia()) return () => undefined;
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const getSnapshot = () => !hasMatchMedia() || window.matchMedia(WIDE_QUERY).matches;

export function useIsWide() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
