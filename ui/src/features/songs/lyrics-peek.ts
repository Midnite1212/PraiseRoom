import { type ChordLine, parseChordLyrics } from '@/features/chords/parse';

export const PEEK_LINES = 4;

export type LyricsPeek = { label: string | null; lines: ChordLine[] };

// The opening lines of a song's first section, up to its first blank line, with their chords.
export const lyricsPeek = (chordLyrics: string): LyricsPeek | null => {
  const section = parseChordLyrics(chordLyrics)[0];
  if (!section) return null;
  const firstBlank = section.lines.findIndex(({ segments }) => segments.length === 0);
  const block = firstBlank === -1 ? section.lines : section.lines.slice(0, firstBlank);
  const lines = block.slice(0, PEEK_LINES);
  return lines.length === 0 ? null : { label: section.label, lines };
};
