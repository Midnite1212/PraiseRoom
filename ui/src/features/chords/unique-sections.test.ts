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

  it('dedupes unlabelled sections by body like any other', () => {
    const { sections, flow } = uniqueSections(
      parseChordLyrics('Line\n\n{Verse}\nOther\n\n{}\nLine')
    );

    expect(sections.map(({ label }) => label)).toEqual([null, 'Verse']);
    expect(flow).toEqual([0, 1, 0]);
  });
});
