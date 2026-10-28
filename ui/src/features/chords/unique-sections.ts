import type { ChordSection } from './parse';

export type UniqueSections = {
  sections: ChordSection[];
  // For each section in the song's flow, the index in `sections` that shows it.
  flow: number[];
};

const normalise = (text: string): string => text.replace(/\s+/g, ' ').trim();

// A section's body with labels ignored and whitespace normalised: the same chords on the same words, line
// for line, is the same section.
export const sectionBodyKey = (section: ChordSection): string =>
  section.lines
    .map((line) =>
      line.segments
        .map(({ chord, lyric }) => `${normalise(chord ?? '')}|${normalise(lyric)}`)
        .join('\t')
    )
    .join('\n');

// The first occurrence of each distinct section, in song order, plus where each flow position lands.
export const uniqueSections = (all: readonly ChordSection[]): UniqueSections => {
  const sections: ChordSection[] = [];
  const flow: number[] = [];
  const seen = new Map<string, number>();
  for (const section of all) {
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
