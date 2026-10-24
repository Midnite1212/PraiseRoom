import type { MusicKey } from '@/features/chords/theory';
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

export const ACCIDENTALS = ['auto', 'sharp', 'flat'] as const;
export type Accidentals = (typeof ACCIDENTALS)[number];

export const useAccidentals = createStoredChoice('chord-accidentals', ACCIDENTALS, 'auto').use;

export const CHORD_STYLES = ['full', 'simple'] as const;
export type ChordStyle = (typeof CHORD_STYLES)[number];

export const useChordStyle = createStoredChoice('chord-style', CHORD_STYLES, 'full').use;

export const COLOUR_CHORDS = ['off', 'on'] as const;
export type ColourChords = (typeof COLOUR_CHORDS)[number];

export const useColourChords = createStoredChoice('chord-colour', COLOUR_CHORDS, 'off').use;

export const chordsUseFlats = (accidentals: Accidentals, playKey: MusicKey | null): boolean =>
  accidentals === 'auto' ? (playKey?.prefersFlats ?? false) : accidentals === 'flat';

export const GUITAR_CAPO = ['off', 'on'] as const;
export type GuitarCapo = (typeof GUITAR_CAPO)[number];

export const useGuitarCapo = createStoredChoice('guitar-capo', GUITAR_CAPO, 'off').use;

export const MAX_CAPO = 9;

// A capo only applies while the Guitar capo switch is on.
export const activeCapo = (guitarCapo: GuitarCapo, capo: number): number =>
  guitarCapo === 'on' ? capo : 0;
