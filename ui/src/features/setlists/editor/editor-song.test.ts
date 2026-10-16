import { describe, expect, it } from 'vitest';

import { keyOptionsFor, moveItem, toSongKeys } from './editor-song';

const song = (id: string, originalKey: string, key: string) => ({
  _id: id,
  title: id,
  artist: 'Artist',
  originalKey,
  key,
});

describe('editor songs', () => {
  it('offers twelve keys in the song mode', () => {
    expect(keyOptionsFor('G')).toHaveLength(12);
    expect(keyOptionsFor('Em')).toContain('F#m');
    expect(keyOptionsFor('not a key')).toEqual([]);
  });

  it('stores only keys that differ from the original', () => {
    expect(toSongKeys([song('a', 'G', 'G'), song('b', 'G', 'A'), song('c', 'Bb', 'A#')])).toEqual([
      { songId: 'b', key: 'A' },
    ]);
  });

  it('moves items without mutating the input and ignores moves off the ends', () => {
    const items = ['a', 'b', 'c'];
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(items, 2, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(items, 0, -1)).toEqual(items);
    expect(items).toEqual(['a', 'b', 'c']);
  });
});
