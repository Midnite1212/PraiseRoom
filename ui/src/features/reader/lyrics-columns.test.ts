import { describe, expect, it } from 'vitest';

import { LYRICS_COLUMN_CLASSES, nextLyricsColumns } from './lyrics-columns';

describe('lyrics columns', () => {
  it('cycles 1 → 2 → 3 → 1', () => {
    expect(nextLyricsColumns('1')).toBe('2');
    expect(nextLyricsColumns('2')).toBe('3');
    expect(nextLyricsColumns('3')).toBe('1');
  });

  it('uses the chosen column count at every width, phones included', () => {
    expect(LYRICS_COLUMN_CLASSES['1']).toBe('columns-1');
    expect(LYRICS_COLUMN_CLASSES['2']).toBe('columns-2');
    expect(LYRICS_COLUMN_CLASSES['3']).toBe('columns-3');
  });
});
