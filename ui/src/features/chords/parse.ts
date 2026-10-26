export type ChordSegment = { id: string; chord: string | null; lyric: string };

export type ChordLine = { id: string; segments: ChordSegment[] };

export type ChordSection = { id: string; label: string | null; lines: ChordLine[] };

const SECTION_PATTERN = /^\s*\{([^{}]*)\}\s*$/;
const SEGMENT_PATTERN = /\[([^[\]]*)\]/g;

const parseSegments = (line: string, lineId: string): ChordSegment[] => {
  const segments: ChordSegment[] = [];
  const add = (chord: string | null, lyric: string) =>
    segments.push({ id: `${lineId}.${segments.length}`, chord, lyric });
  let cursor = 0;
  let pendingChord: string | null = null;
  for (const match of line.matchAll(SEGMENT_PATTERN)) {
    const lyric = line.slice(cursor, match.index);
    if (pendingChord !== null || lyric !== '') add(pendingChord, lyric);
    pendingChord = match[1]?.trim() ?? '';
    cursor = match.index + match[0].length;
  }
  const rest = line.slice(cursor);
  if (pendingChord !== null || rest !== '') add(pendingChord, rest);
  return segments;
};

const isBlank = (line: ChordLine | undefined) => line?.segments.length === 0;

const trimBlankEdges = (lines: ChordLine[]): ChordLine[] => {
  let start = 0;
  let end = lines.length;
  while (start < end && isBlank(lines[start])) start++;
  while (end > start && isBlank(lines[end - 1])) end--;
  return lines.slice(start, end);
};

// `{Verse 1}` on its own line starts a section; `[G]` before a syllable is the chord sung on it.
// Ids are positional and stable for the same text, so React can key the rendered lines by them.
export const parseChordLyrics = (text: string | null | undefined): ChordSection[] => {
  const sections: ChordSection[] = [];
  let current: ChordSection = { id: 's0', label: null, lines: [] };
  const rawLines = (text ?? '').replace(/\r\n?/g, '\n').split('\n');
  for (const [lineNumber, rawLine] of rawLines.entries()) {
    const section = SECTION_PATTERN.exec(rawLine);
    if (section) {
      sections.push(current);
      current = { id: `s${lineNumber + 1}`, label: section[1]?.trim() || null, lines: [] };
      continue;
    }
    const id = `l${lineNumber}`;
    current.lines.push({ id, segments: rawLine.trim() === '' ? [] : parseSegments(rawLine, id) });
  }
  sections.push(current);
  return sections
    .map(({ id, label, lines }) => ({ id, label, lines: trimBlankEdges(lines) }))
    .filter((entry) => entry.lines.length > 0);
};

export const hasChords = (sections: ChordSection[]): boolean =>
  sections.some(({ lines }) =>
    lines.some(({ segments }) => segments.some(({ chord }) => chord !== null && chord !== ''))
  );

export const hasLyrics = ({ lines }: ChordSection): boolean =>
  lines.some(({ segments }) => segments.some(({ lyric }) => lyric.trim() !== ''));
