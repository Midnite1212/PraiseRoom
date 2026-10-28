import type { ChordLine, ChordSection } from './parse';

export type UniqueSections = {
  sections: ChordSection[];
  // For each section in the song's flow, the index in `sections` that shows it.
  flow: number[];
};

const normalise = (text: string): string => text.replace(/\s+/g, ' ').trim();

const lineKey = (line: ChordLine): string =>
  line.segments
    .map(({ chord, lyric }) => `${normalise(chord ?? '')}|${normalise(lyric)}`)
    .join('\t');

const isBlank = (line: ChordLine | undefined): boolean => line?.segments.length === 0;

// The shortest run of lines that, written back to back (with or without a blank line between), makes
// up the whole section; the section itself when it does not repeat.
export const collapseRepeats = (lines: ChordLine[]): ChordLine[] => {
  const keys = lines.map(lineKey);
  for (let period = 1; period < lines.length; period++) {
    if (isBlank(lines[period - 1])) continue;
    let position = period;
    while (position < lines.length) {
      if (isBlank(lines[position])) position++;
      const next = keys.slice(position, position + period);
      if (next.length !== period || next.some((key, index) => key !== keys[index])) break;
      position += period;
    }
    if (position === lines.length) return lines.slice(0, period);
  }
  return lines;
};

// A section's body with labels ignored, whitespace normalised, and back-to-back repeats collapsed: the
// same chords on the same words, line for line, is the same section.
export const sectionBodyKey = (section: ChordSection): string =>
  section.lines.map(lineKey).join('\n');

// The first occurrence of each distinct section, in song order, plus where each flow position lands.
export const uniqueSections = (all: readonly ChordSection[]): UniqueSections => {
  const sections: ChordSection[] = [];
  const flow: number[] = [];
  const seen = new Map<string, number>();
  for (const original of all) {
    const section = { ...original, lines: collapseRepeats(original.lines) };
    const key = sectionBodyKey(section);
    let index = seen.get(key);
    if (index === undefined) {
      index = sections.length;
      seen.set(key, index);
      sections.push(section);
    }
    flow.push(index);
  }
  return { sections, flow };
};
