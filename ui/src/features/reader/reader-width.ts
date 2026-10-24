import { createStoredChoice } from '@/lib/stored-choice';

export const READER_WIDTHS = ['capped', 'full'] as const;
export type ReaderWidth = (typeof READER_WIDTHS)[number];

export const useReaderWidth = createStoredChoice('reader-width', READER_WIDTHS, 'capped').use;

export const toggleReaderWidth = (width: ReaderWidth): ReaderWidth =>
  width === 'full' ? 'capped' : 'full';
