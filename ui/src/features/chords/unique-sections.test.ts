import { describe, expect, it } from 'vitest';

import { parseChordLyrics } from './parse';
import { uniqueSections } from './unique-sections';

const CHORUS = '[G]Holy, [C]holy';

describe('uniqueSections', () => {
  it('keeps the first copy of a repeated section and maps every flow position to it', () => {
    const { sections, flow } = uniqueSections(
      parseChordLyrics(
        `{Verse 1}\n[G]Line one\n{Chorus}\n${CHORUS}\n{Verse 2}\n[G]Line two\n{Chorus}\n${CHORUS}\n{Chorus}\n${CHORUS}`
      )
    );

    expect(sections.map(({ label }) => label)).toEqual(['Verse 1', 'Chorus', 'Verse 2']);
    expect(flow).toEqual([0, 1, 2, 1, 1]);
  });

  it('matches on the body, not the label', () => {
    const { sections, flow } = uniqueSections(
      parseChordLyrics(`{Chorus}\n${CHORUS}\n{Chorus 2}\n${CHORUS}\n{Final Chorus}\n${CHORUS}`)
    );

    expect(sections).toHaveLength(1);
    expect(sections[0]?.label).toBe('Chorus');
    expect(flow).toEqual([0, 0, 0]);
  });

  it('keeps sections whose lyrics or chords differ at all', () => {
    const { sections } = uniqueSections(
      parseChordLyrics(
        `{Chorus}\n${CHORUS}\n{Chorus}\n${CHORUS}\nIs the Lord\n{Chorus}\n[G]Holy, [D]holy\n{Verse 1}\nLine one\n{Verse 2}\nLine two`
      )
    );

    expect(sections).toHaveLength(5);
  });

  it('ignores whitespace differences', () => {
    const { sections } = uniqueSections(
      parseChordLyrics(`{Chorus}\n[G]Holy,  [C]holy  \n{Chorus}\n[ G ]Holy, [C]holy`)
    );

    expect(sections).toHaveLength(1);
  });

  it('collapses a section written twice in a row and matches it to the single copy', () => {
    const { sections, flow } = uniqueSections(
      parseChordLyrics(
        `{Chorus 1}\n${CHORUS}\nIs the Lord\n{Verse 2}\nLine\n{Chorus 2}\n${CHORUS}\nIs the Lord\n\n${CHORUS}\nIs the Lord\n{Chorus 3}\n${CHORUS}\nIs the Lord\n${CHORUS}\nIs the Lord\n${CHORUS}\nIs the Lord`
      )
    );

    expect(sections.map(({ label }) => label)).toEqual(['Chorus 1', 'Verse 2']);
    expect(sections[0]?.lines).toHaveLength(2);
    expect(flow).toEqual([0, 1, 0, 0]);
  });

  it('collapses one line sung over and over to a single line', () => {
    const { sections } = uniqueSections(
      parseChordLyrics('{Bridge}\n[G]Holy\n[G]Holy\n[G]Holy\n[G]Holy')
    );

    expect(sections[0]?.lines.map((line) => line.id)).toEqual(['l1']);
  });

  it('keeps a section that repeats with an extra line, since it is not a whole repeat', () => {
    const { sections } = uniqueSections(
      parseChordLyrics(`{Chorus}\n${CHORUS}\n{Chorus}\n${CHORUS}\n${CHORUS}\nForever`)
    );

    expect(sections).toHaveLength(2);
    expect(sections[1]?.lines).toHaveLength(3);
  });

  it('dedupes unlabelled sections by body like any other', () => {
    const { sections, flow } = uniqueSections(
      parseChordLyrics('Line\n\n{Verse}\nOther\n\n{}\nLine')
    );

    expect(sections.map(({ label }) => label)).toEqual([null, 'Verse']);
    expect(flow).toEqual([0, 1, 0]);
  });
});
