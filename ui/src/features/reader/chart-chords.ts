import { parseChordLyrics } from '@/features/chords/parse';
import { parseChord } from '@/features/chords/theory';

// Every distinct chord as the reader spells it, in order of first appearance; cues such as `[x2]` are skipped.
export const chartChords = (chordLyrics: string, spell: (chord: string) => string): string[] => {
  const names = new Set<string>();
  for (const { lines } of parseChordLyrics(chordLyrics)) {
    for (const { segments } of lines) {
      for (const { chord } of segments) {
        if (chord && parseChord(chord)) names.add(spell(chord));
      }
    }
  }
  return [...names];
};
