import i18n from 'i18next';
import { describe, expect, it } from 'vitest';

import type { SongSummary } from './api';
import { groupSongs, hasGroups } from './song-groups';

const song = (
  title: string,
  code: string | null = null,
  fields: Partial<SongSummary> = {}
): SongSummary => ({
  _id: title,
  urlKey: 'k3x9p2',
  title,
  artist: 'Artist',
  originalKey: 'G',
  tempo: [],
  timeSignature: [],
  themes: [],
  code,
  ...fields,
});

const t = i18n.t.bind(i18n);

describe('groupSongs', () => {
  it('groups by leading letter and collects other characters under #', () => {
    const groups = groupSongs(
      [song('amazing'), song('Abba'), song('Be'), song('10,000'), song('漢')],
      'title',
      t
    );
    expect(groups?.map((group) => [group.label, group.songs.length])).toEqual([
      ['A', 2],
      ['B', 1],
      ['#', 2],
    ]);
  });

  it('groups by the code prefix', () => {
    const groups = groupSongs([song('x', 'a1'), song('y', 'A2'), song('z', null)], 'code', t);
    expect(groups?.map((group) => group.label)).toEqual(['A', '#']);
  });

  it('gives each group a unique id', () => {
    const groups = groupSongs([song('A'), song('B'), song('A')], 'title', t);
    expect(new Set(groups?.map((group) => group.id)).size).toBe(3);
  });

  it('groups by original key in the order the list arrives', () => {
    const groups = groupSongs(
      [
        song('a', null, { originalKey: 'D' }),
        song('b', null, { originalKey: 'D' }),
        song('c', null, { originalKey: 'Em' }),
        song('d', null, { originalKey: 'D' }),
      ],
      'key',
      t
    );
    expect(groups?.map((group) => [group.label, group.songs.length])).toEqual([
      ['Key of D', 2],
      ['Key of Em', 1],
      ['Key of D', 1],
    ]);
  });

  it('groups by the fastest tempo name and labels songs without one', () => {
    const groups = groupSongs(
      [
        song('a', null, { tempo: ['Slow'] }),
        song('b', null, { tempo: ['Slow', 'Fast'] }),
        song('c', null, { tempo: ['Medium Slow'] }),
        song('d', null, { tempo: [] }),
      ],
      'tempo',
      t
    );
    expect(groups?.map((group) => group.label)).toEqual([
      'Slow',
      'Fast',
      'Medium slow',
      'No tempo',
    ]);
  });

  it('knows which sorts have groups', () => {
    expect(hasGroups('title')).toBe(true);
    expect(hasGroups('key')).toBe(true);
    expect(hasGroups('tempo')).toBe(true);
  });
});

describe('groupSongs without information', () => {
  it('returns null when every song falls under #', () => {
    expect(groupSongs([song('x'), song('y')], 'code', t)).toBeNull();
  });
});
