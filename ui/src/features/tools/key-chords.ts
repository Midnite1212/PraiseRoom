import { chordToNumber } from '@/features/chords/nashville';
import { type MusicKey, noteName } from '@/features/chords/theory';

const MAJOR_SCALE = [
  { semitones: 0, quality: '', roman: 'I' },
  { semitones: 2, quality: 'm', roman: 'ii' },
  { semitones: 4, quality: 'm', roman: 'iii' },
  { semitones: 5, quality: '', roman: 'IV' },
  { semitones: 7, quality: '', roman: 'V' },
  { semitones: 9, quality: 'm', roman: 'vi' },
  { semitones: 11, quality: 'dim', roman: 'vii°' },
] as const;

export type KeyChord = { name: string; number: string; roman: string };

export const chordsInKey = (key: MusicKey): KeyChord[] =>
  MAJOR_SCALE.map(({ semitones, quality, roman }) => {
    const name = `${noteName(key.root + semitones, key.prefersFlats)}${quality}`;
    return { name, number: chordToNumber(name, key), roman };
  });

// Scale degrees count from 1, as musicians say them: 1-5-6-4.
export const PROGRESSIONS = [
  { id: 'one-five-six-four', degrees: [1, 5, 6, 4] },
  { id: 'one-four-six-five', degrees: [1, 4, 6, 5] },
  { id: 'two-five-one', degrees: [2, 5, 1] },
] as const;

export const buildProgression = (key: MusicKey, degrees: readonly number[]): KeyChord[] => {
  const chords = chordsInKey(key);
  return degrees.flatMap((degree) => chords[degree - 1] ?? []);
};

export const progressionName = (chords: readonly KeyChord[]): string =>
  chords.map(({ roman }) => roman).join('–');
