import { describe, expect, it } from 'vitest';

import { type ChordSection, hasChords, parseChordLyrics } from './parse';

const shape = (sections: ChordSection[]) =>
  sections.map(({ label, lines }) => ({
    label,
    lines: lines.map(({ segments }) => segments.map(({ chord, lyric }) => ({ chord, lyric }))),
  }));

describe('parseChordLyrics', () => {
  it('splits sections and pairs each chord with the lyric that follows it', () => {
    expect(shape(parseChordLyrics('{Verse 1}\n[G]Amazing [C]grace\n{Chorus}\n[D]Sing'))).toEqual([
      {
        label: 'Verse 1',
        lines: [
          [
            { chord: 'G', lyric: 'Amazing ' },
            { chord: 'C', lyric: 'grace' },
          ],
        ],
      },
      { label: 'Chorus', lines: [[{ chord: 'D', lyric: 'Sing' }]] },
    ]);
  });

  it('keeps lyrics before the first chord and chord-only lines', () => {
    const [section] = shape(parseChordLyrics('Be [D]Thou\n[G] [C] [D]'));
    expect(section?.label).toBeNull();
    expect(section?.lines[0]).toEqual([
      { chord: null, lyric: 'Be ' },
      { chord: 'D', lyric: 'Thou' },
    ]);
    expect(section?.lines[1]?.map(({ chord }) => chord)).toEqual(['G', 'C', 'D']);
  });

  it('keeps blank lines inside a section but trims them at the edges', () => {
    const [section] = shape(parseChordLyrics('{Verse}\n\nLine one\n\nLine two\n\n'));
    expect(section?.lines.map((segments) => segments.length)).toEqual([1, 0, 1]);
  });

  it('treats unmatched brackets as text and handles Windows line endings', () => {
    const [section] = shape(parseChordLyrics('Grace [unclosed\r\n{Bridge}\r\n[A]Now'));
    expect(section?.lines[0]).toEqual([{ chord: null, lyric: 'Grace [unclosed' }]);
    expect(parseChordLyrics('{Bridge}\r\n[A]Now')[0]?.label).toBe('Bridge');
  });

  it('returns nothing for empty input and drops empty sections', () => {
    expect(parseChordLyrics(null)).toEqual([]);
    expect(shape(parseChordLyrics('{Intro}\n{Verse}\nWords'))).toEqual([
      { label: 'Verse', lines: [[{ chord: null, lyric: 'Words' }]] },
    ]);
  });

  it('gives every section, line, and segment a unique id that is stable for the same text', () => {
    const text = '{Verse}\n[G]A [C]B\n\n[D]C\n{Verse}\n[G]A';
    const sections = parseChordLyrics(text);
    const lines = sections.flatMap((section) => section.lines);
    const ids = [
      sections.map((section) => section.id),
      lines.map((line) => line.id),
      lines.flatMap((line) => line.segments.map((segment) => segment.id)),
    ].flat();
    expect(new Set(ids).size).toBe(ids.length);
    expect(parseChordLyrics(text)).toEqual(parseChordLyrics(text));
  });
});

describe('hasChords', () => {
  it('detects whether any line carries a chord', () => {
    expect(hasChords(parseChordLyrics('Just words'))).toBe(false);
    expect(hasChords(parseChordLyrics('[G]Words'))).toBe(true);
  });
});
