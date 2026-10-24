import { createStoredChoice } from '@/lib/stored-choice';

export const READER_LAYOUTS = ['one', 'split'] as const;

export type ReaderLayoutChoice = (typeof READER_LAYOUTS)[number];

// A hook-named alias, so the React Compiler calls it on every render instead of memoizing it.
export const useReaderLayout = createStoredChoice('reader-layout', READER_LAYOUTS, 'split').use;

export type RightPane = {
  // Position in the set of the song beside the current one; null past the last song ("End of the set").
  index: number | null;
  isPinned: boolean;
};

// The right pane shows the pinned song, or the next song in the set while nothing is pinned. A pin on the
// song that is already in the left pane, or on a song that left the set, is ignored.
export const rightPane = (
  ids: readonly string[],
  currentIndex: number,
  pinnedId: string | null
): RightPane => {
  const pinnedIndex =
    pinnedId === null
      ? -1
      : ids.findIndex((id, index) => id === pinnedId && index !== currentIndex);
  if (pinnedIndex >= 0) return { index: pinnedIndex, isPinned: true };
  const next = currentIndex + 1;
  return { index: next < ids.length ? next : null, isPinned: false };
};

// Choosing the song that follows anyway, or "follow the set", leaves nothing pinned.
export const pinAfterPick = (
  ids: readonly string[],
  currentIndex: number,
  pickedId: string | null
): string | null => (pickedId === null || pickedId === ids[currentIndex + 1] ? null : pickedId);

// Moving the left pane onto the pinned song takes the pin with it.
export const pinAfterMove = (
  ids: readonly string[],
  pinnedId: string | null,
  newIndex: number
): string | null => (pinnedId !== null && ids[newIndex] === pinnedId ? null : pinnedId);

// The songs the right pane can show: every song except the one in the left pane.
export const rightPickIndexes = (count: number, currentIndex: number): number[] =>
  Array.from({ length: count }, (_, index) => index).filter((index) => index !== currentIndex);
