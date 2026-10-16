import { describe, expect, it } from 'vitest';

import { hasChords, parseChordLyrics } from './parse';

describe('parseChordLyrics', () => {
  it('splits sections and pairs each chord with the lyric that follows it', () => {
    const sections = parseChordLyrics('{Verse 1}\n[G]Amazing [C]grace\n{Chorus}\n[D]Sing');
    expect(sections).toEqual([
      {
        label: 'Verse 1',
        lines: [
          {
            segments: [
              { chord: 'G', lyric: 'Amazing ' },
              { chord: 'C', lyric: 'grace' },
            ],
          },
        ],
      },
      { label: 'Chorus', lines: [{ segments: [{ chord: 'D', lyric: 'Sing' }] }] },
    ]);
  });

  it('keeps lyrics before the first chord and chord-only lines', () => {
    const [section] = parseChordLyrics('Be [D]Thou\n[G] [C] [D]');
    expect(section?.label).toBeNull();
    expect(section?.lines[0]?.segments).toEqual([
      { chord: null, lyric: 'Be ' },
      { chord: 'D', lyric: 'Thou' },
    ]);
    expect(section?.lines[1]?.segments.map(({ chord }) => chord)).toEqual(['G', 'C', 'D']);
  });

  it('keeps blank lines inside a section but trims them at the edges', () => {
    const [section] = parseChordLyrics('{Verse}\n\nLine one\n\nLine two\n\n');
    expect(section?.lines.map(({ segments }) => segments.length)).toEqual([1, 0, 1]);
  });

  it('treats unmatched brackets as text and handles Windows line endings', () => {
    const [section] = parseChordLyrics('Grace [unclosed\r\n{Bridge}\r\n[A]Now');
    expect(section?.lines[0]?.segments).toEqual([{ chord: null, lyric: 'Grace [unclosed' }]);
    expect(parseChordLyrics('{Bridge}\r\n[A]Now')[0]?.label).toBe('Bridge');
  });

  it('returns nothing for empty input and drops empty sections', () => {
    expect(parseChordLyrics(null)).toEqual([]);
    expect(parseChordLyrics('{Intro}\n{Verse}\nWords')).toEqual([
      { label: 'Verse', lines: [{ segments: [{ chord: null, lyric: 'Words' }] }] },
    ]);
  });
});

describe('hasChords', () => {
  it('detects whether any line carries a chord', () => {
    expect(hasChords(parseChordLyrics('Just words'))).toBe(false);
    expect(hasChords(parseChordLyrics('[G]Words'))).toBe(true);
  });
});
