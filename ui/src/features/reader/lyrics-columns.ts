import { createStoredChoice } from '@/lib/stored-choice';

export const LYRICS_COLUMNS = ['1', '2', '3'] as const;

export type LyricsColumns = (typeof LYRICS_COLUMNS)[number];

export const DEFAULT_LYRICS_COLUMNS: LyricsColumns = '2';

const lyricsColumns = createStoredChoice('lyrics-columns', LYRICS_COLUMNS, DEFAULT_LYRICS_COLUMNS);

export const useLyricsColumns = lyricsColumns.use;

export const nextLyricsColumns = (columns: LyricsColumns): LyricsColumns =>
  LYRICS_COLUMNS[(LYRICS_COLUMNS.indexOf(columns) + 1) % LYRICS_COLUMNS.length] ??
  DEFAULT_LYRICS_COLUMNS;

export const LYRICS_COLUMN_CLASSES: Record<LyricsColumns, string> = {
  '1': 'columns-1',
  '2': 'columns-2',
  '3': 'columns-3',
};

export const LYRICS_COLUMN_GAP_CLASSES = 'wide:gap-8 gap-5';
