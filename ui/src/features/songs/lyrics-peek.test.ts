import { describe, expect, it } from 'vitest';

import { lyricsPeek } from './lyrics-peek';

describe('lyricsPeek', () => {
  it('returns the first section label and its lines with chords', () => {
    const peek = lyricsPeek('{Verse 1}\n[G]Line [C]one\nLine two\n\n{Chorus}\nOther');

    expect(peek?.label).toBe('Verse 1');
    expect(peek?.lines).toHaveLength(2);
    expect(peek?.lines[0]?.segments.map(({ chord }) => chord)).toEqual(['G', 'C']);
  });

  it('keeps at most four lines', () => {
    expect(lyricsPeek('a\nb\nc\nd\ne\nf')?.lines).toHaveLength(4);
  });

  it('stops at the first blank line when the song has no section label', () => {
    const peek = lyricsPeek('first\n\nsecond');

    expect(peek?.label).toBeNull();
    expect(peek?.lines).toHaveLength(1);
  });

  it('returns null for empty text', () => {
    expect(lyricsPeek('')).toBeNull();
    expect(lyricsPeek('{Verse}')).toBeNull();
  });
});
