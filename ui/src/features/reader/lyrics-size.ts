import { createStoredChoice } from '@/lib/stored-choice';

export const LYRICS_SIZES = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

export type LyricsSize = (typeof LYRICS_SIZES)[number];

export const DEFAULT_LYRICS_SIZE: LyricsSize = 'lg';

const lyricsSize = createStoredChoice('lyrics-size', LYRICS_SIZES, DEFAULT_LYRICS_SIZE);

export const readLyricsSize = lyricsSize.read;
export const setLyricsSize = lyricsSize.write;

// Applied with `data-lyrics-size` on the reading sheet; `src/styles.css` maps it to `--lyrics-size`.
export const useLyricsSize = lyricsSize.use;

export const stepLyricsSize = (size: LyricsSize, step: -1 | 1): LyricsSize => {
  const index = LYRICS_SIZES.indexOf(size) + step;
  return LYRICS_SIZES[Math.min(Math.max(index, 0), LYRICS_SIZES.length - 1)] ?? size;
};
