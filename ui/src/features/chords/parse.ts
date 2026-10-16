export type ChordSegment = { chord: string | null; lyric: string };

export type ChordLine = { segments: ChordSegment[] };

export type ChordSection = { label: string | null; lines: ChordLine[] };

const SECTION_PATTERN = /^\s*\{([^{}]*)\}\s*$/;
const SEGMENT_PATTERN = /\[([^[\]]*)\]/g;

const parseLine = (line: string): ChordLine => {
  const segments: ChordSegment[] = [];
  let cursor = 0;
  let pendingChord: string | null = null;
  for (const match of line.matchAll(SEGMENT_PATTERN)) {
    const lyric = line.slice(cursor, match.index);
    if (pendingChord !== null || lyric !== '') segments.push({ chord: pendingChord, lyric });
    pendingChord = match[1]?.trim() ?? '';
    cursor = match.index + match[0].length;
  }
  const rest = line.slice(cursor);
  if (pendingChord !== null || rest !== '') segments.push({ chord: pendingChord, lyric: rest });
  return { segments };
};

const trimBlankEdges = (lines: ChordLine[]): ChordLine[] => {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]?.segments.length === 0) start++;
  while (end > start && lines[end - 1]?.segments.length === 0) end--;
  return lines.slice(start, end);
};

// `{Verse 1}` on its own line starts a section; `[G]` before a syllable is the chord sung on it.
export const parseChordLyrics = (text: string | null | undefined): ChordSection[] => {
  const sections: ChordSection[] = [];
  let current: ChordSection = { label: null, lines: [] };
  for (const rawLine of (text ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const section = SECTION_PATTERN.exec(rawLine);
    if (section) {
      sections.push(current);
      current = { label: section[1]?.trim() || null, lines: [] };
      continue;
    }
    current.lines.push(rawLine.trim() === '' ? { segments: [] } : parseLine(rawLine));
  }
  sections.push(current);
  return sections
    .map(({ label, lines }) => ({ label, lines: trimBlankEdges(lines) }))
    .filter((entry) => entry.lines.length > 0);
};

export const hasChords = (sections: ChordSection[]): boolean =>
  sections.some(({ lines }) =>
    lines.some(({ segments }) => segments.some(({ chord }) => chord !== null && chord !== ''))
  );
