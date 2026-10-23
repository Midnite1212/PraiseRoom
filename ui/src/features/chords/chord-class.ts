import { type MusicKey, parseChord } from './theory';

export const CHORD_CLASSES = ['one', 'four', 'five', 'minor', 'other'] as const;
export type ChordClass = (typeof CHORD_CLASSES)[number];

const CLASS_BY_SEMITONES: Partial<Record<number, ChordClass>> = {
  0: 'one',
  5: 'four',
  7: 'five',
  2: 'minor',
  4: 'minor',
  9: 'minor',
};

// By the chord's root against the song's original key, so the colour stays with the chord's job
// through transposing, Simple chords, and numbers. The ii, iii and vi share the minor colour.
export const classifyChord = (chord: string, originalKey: MusicKey): ChordClass => {
  const parsed = parseChord(chord);
  if (!parsed) return 'other';
  return CLASS_BY_SEMITONES[(((parsed.root - originalKey.root) % 12) + 12) % 12] ?? 'other';
};
