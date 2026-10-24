import { type ChordLine, parseChordLyrics } from '@/features/chords/parse';

export const PEEK_LINES = 4;

export type LyricsPeek = { label: string | null; lines: ChordLine[] };

const VERSE_ONE = /^verse\s*1?$/i;

// The opening lines of a song's "Verse 1" (or its first section when there is none), up to the
// section's first blank line, with their chords.
export const lyricsPeek = (chordLyrics: string): LyricsPeek | null => {
  const sections = parseChordLyrics(chordLyrics);
  const section =
    sections.find(({ label }) => label !== null && VERSE_ONE.test(label.trim())) ?? sections[0];
  if (!section) return null;
  const firstBlank = section.lines.findIndex(({ segments }) => segments.length === 0);
  const block = firstBlank === -1 ? section.lines : section.lines.slice(0, firstBlank);
  const lines = block.slice(0, PEEK_LINES);
  return lines.length === 0 ? null : { label: section.label, lines };
};
