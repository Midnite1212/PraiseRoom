import { createStoredChoice } from '@/lib/stored-choice';

export const READER_MODES = ['chords', 'lyrics'] as const;
export type ReaderMode = (typeof READER_MODES)[number];

export const CHORD_NOTATIONS = ['letters', 'numbers'] as const;
export type ChordNotation = (typeof CHORD_NOTATIONS)[number];

export const useReaderMode = createStoredChoice('reader-mode', READER_MODES, 'chords').use;

export const useChordNotation = createStoredChoice(
  'chord-notation',
  CHORD_NOTATIONS,
  'letters'
).use;
