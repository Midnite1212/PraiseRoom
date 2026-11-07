import { shapeKey } from '@/features/chords/key-spelling';
import {
  type MusicKey,
  semitonesBetween,
  simplifyChord,
  transposeChord,
} from '@/features/chords/theory';
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

export const CHORD_CHART = ['off', 'on'] as const;
export type ChordChart = (typeof CHORD_CHART)[number];

export const useChordChart = createStoredChoice('chord-chart', CHORD_CHART, 'on').use;

// 'once' shows each distinct section the first time it appears, in both views; 'all' keeps the song's flow.
export const SECTION_REPEATS = ['once', 'all'] as const;
export type SectionRepeats = (typeof SECTION_REPEATS)[number];

export const useSectionRepeats = createStoredChoice('section-repeats', SECTION_REPEATS, 'once').use;

export const chordsUseFlats = (accidentals: Accidentals, playKey: MusicKey | null): boolean =>
  accidentals === 'auto' ? (playKey?.prefersFlats ?? false) : accidentals === 'flat';

export const MAX_CAPO = 9;

export const styleChord = (chord: string, chordStyle: ChordStyle): string =>
  chordStyle === 'simple' ? simplifyChord(chord) : chord;

// The letters the reader shows: styled, moved to the play key, lowered by the capo, then spelled.
export const createChordSpeller = (
  originalKey: MusicKey | null,
  playKey: MusicKey | null,
  accidentals: Accidentals,
  chordStyle: ChordStyle,
  capo: number
): ((chord: string) => string) => {
  const semitones = originalKey && playKey ? semitonesBetween(originalKey, playKey) - capo : 0;
  const useFlats = chordsUseFlats(accidentals, playKey && shapeKey(playKey, capo));
  return (chord) => transposeChord(styleChord(chord, chordStyle), semitones, useFlats);
};
