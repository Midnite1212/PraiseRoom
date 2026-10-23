import { describe, expect, it } from 'vitest';

import type { SongSummary } from './api';
import { groupSongs, hasGroups } from './song-groups';

const song = (title: string, code: string | null = null): SongSummary => ({
  _id: title,
  title,
  artist: 'Artist',
  originalKey: 'G',
  tempo: [],
  timeSignature: [],
  themes: [],
  code,
});

describe('groupSongs', () => {
  it('groups by leading letter and collects other characters under #', () => {
    const groups = groupSongs(
      [song('amazing'), song('Abba'), song('Be'), song('10,000'), song('漢')],
      'title'
    );
    expect(groups?.map((group) => [group.label, group.songs.length])).toEqual([
      ['A', 2],
      ['B', 1],
      ['#', 2],
    ]);
  });

  it('groups by the code prefix', () => {
    const groups = groupSongs([song('x', 'a1'), song('y', 'A2'), song('z', null)], 'code');
    expect(groups?.map((group) => group.label)).toEqual(['A', '#']);
  });

  it('gives each group a unique id', () => {
    const groups = groupSongs([song('A'), song('B'), song('A')], 'title');
    expect(new Set(groups?.map((group) => group.id)).size).toBe(3);
  });

  it('knows which sorts have groups', () => {
    expect(hasGroups('title')).toBe(true);
  });
});

describe('groupSongs without information', () => {
  it('returns null when every song falls under #', () => {
    expect(groupSongs([song('x'), song('y')], 'code')).toBeNull();
  });
});
