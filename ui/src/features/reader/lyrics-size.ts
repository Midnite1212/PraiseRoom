import { useSyncExternalStore } from 'react';

export const LYRICS_SIZES = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

export type LyricsSize = (typeof LYRICS_SIZES)[number];

export const DEFAULT_LYRICS_SIZE: LyricsSize = 'md';

const STORAGE_KEY = 'lyrics-size';

const listeners = new Set<() => void>();

const isLyricsSize = (value: unknown): value is LyricsSize =>
  LYRICS_SIZES.some((size) => size === value);

export const readLyricsSize = (): LyricsSize => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLyricsSize(stored) ? stored : DEFAULT_LYRICS_SIZE;
  } catch {
    return DEFAULT_LYRICS_SIZE;
  }
};

export const setLyricsSize = (size: LyricsSize): void => {
  try {
    localStorage.setItem(STORAGE_KEY, size);
  } catch {
    // Blocked storage: the size still changes for this visit through the listeners below.
  }
  for (const listener of listeners) listener();
};

export const stepLyricsSize = (size: LyricsSize, step: -1 | 1): LyricsSize => {
  const index = LYRICS_SIZES.indexOf(size) + step;
  return LYRICS_SIZES[Math.min(Math.max(index, 0), LYRICS_SIZES.length - 1)] ?? size;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
};

// The size is applied with `data-lyrics-size` on the reading sheet; `src/styles.css` maps it to `--lyrics-size`.
export const useLyricsSize = (): [LyricsSize, (size: LyricsSize) => void] => [
  useSyncExternalStore(subscribe, readLyricsSize, () => DEFAULT_LYRICS_SIZE),
  setLyricsSize,
];
