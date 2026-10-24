import { describe, expect, it } from 'vitest';

import type { SongSummary } from '@/features/songs/api';

import type { SetlistSummary } from '../api';
import { shortTheme, suggestSongs } from './add-suggestions';

const song = (id: string, themes: string[] = []): SongSummary => ({
  _id: id,
  urlKey: 'k3x9p2',
  title: `Song ${id}`,
  artist: 'Artist',
  originalKey: 'G',
  tempo: [],
  timeSignature: [],
  themes,
});

const setlist = (
  id: string,
  date: string | null,
  songIds: string[],
  groupIds: string[] = []
): SetlistSummary => ({
  _id: id,
  urlKey: 'a7m4qd',
  name: `Set ${id}`,
  date,
  groupIds,
  songs: songIds.map((songId) => ({ _id: songId, title: `Song ${songId}` })),
});

const day = (value: string) => new Date(`${value}T00:00:00`).toISOString();
const TODAY = '2026-06-01';

const ids = (items: { song: SongSummary }[]) => items.map((item) => item.song._id);

describe('suggestSongs', () => {
  const library = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => song(id));

  it('offers songs from other sets in the same folders, newest set first', () => {
    const result = suggestSongs({
      library,
      setlists: [
        setlist('old', day('2026-01-04'), ['a'], ['g1']),
        setlist('new', day('2026-05-10'), ['b'], ['g1']),
        setlist('elsewhere', day('2026-05-20'), ['c'], ['g2']),
      ],
      setlistId: 'self',
      draft: { songs: [], groupIds: ['g1'] },
      today: TODAY,
    });
    expect(ids(result.recent)).toEqual(['b', 'a']);
  });

  it('draws from every set when the set has no folder, and skips its own and its songs', () => {
    const result = suggestSongs({
      library,
      setlists: [
        setlist('self', day('2026-05-30'), ['f']),
        setlist('x', day('2026-05-10'), ['a', 'c']),
      ],
      setlistId: 'self',
      draft: { songs: [{ ...song('a'), key: 'G', note: '' }], groupIds: [] },
      today: TODAY,
    });
    expect(ids(result.recent)).toEqual(['c']);
  });

  it('puts the songs sung longest ago, or never, in Not sung lately', () => {
    const result = suggestSongs({
      library,
      setlists: [
        setlist('1', day('2026-05-20'), ['a']),
        setlist('2', day('2026-02-01'), ['b']),
        setlist('3', day('2026-07-01'), ['c']),
      ],
      setlistId: 'self',
      draft: { songs: [], groupIds: ['none'] },
      today: TODAY,
    });
    expect(ids(result.recent)).toEqual([]);
    expect(ids(result.lately)).toEqual(['c', 'd', 'e', 'f']);
    expect(result.lately.map((item) => item.lastSung)).toEqual(['', '', '', '']);
  });

  it('reports the last sung date from sets before today', () => {
    const result = suggestSongs({
      library: [song('a'), song('b')],
      setlists: [
        setlist('1', day('2026-03-01'), ['a']),
        setlist('2', day('2026-05-20'), ['a']),
        setlist('3', day('2026-06-08'), ['a']),
      ],
      setlistId: 'self',
      draft: { songs: [], groupIds: ['none'] },
      today: TODAY,
    });
    expect(ids(result.lately)).toEqual(['b', 'a']);
    expect(result.lately[1]?.lastSung).toBe('2026-05-20');
  });

  it('suggests songs sharing the set themes, most shared first, without repeating a group', () => {
    const themed = [
      song('s', ['Hope', 'Prayer']),
      song('a', ['Hope']),
      song('b', ['Hope', 'Prayer']),
      song('c', ['Repentance']),
      song('d'),
    ];
    const result = suggestSongs({
      library: themed,
      setlists: [],
      setlistId: 'self',
      draft: { songs: [{ ...song('s'), key: 'G', note: '' }], groupIds: [] },
      today: TODAY,
    });
    expect(ids(result.lately)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.fits).toEqual([]);

    const many = [
      song('s', ['Hope', 'Prayer']),
      ...['a', 'b', 'c', 'd', 'e', 'f'].map((id) => song(id)),
    ];
    const withFits = suggestSongs({
      library: [...many, song('x', ['Hope']), song('y', ['Hope', 'Prayer'])],
      setlists: [],
      setlistId: 'self',
      draft: { songs: [{ ...song('s'), key: 'G', note: '' }], groupIds: [] },
      today: TODAY,
    });
    expect(ids(withFits.fits)).toEqual(['y', 'x']);
    expect(withFits.fits[0]?.sharedThemes).toEqual(['Hope', 'Prayer']);
  });

  it('ignores set songs missing from the library', () => {
    const result = suggestSongs({
      library: [song('a')],
      setlists: [setlist('x', day('2026-05-10'), ['gone', 'a'])],
      setlistId: 'self',
      draft: { songs: [], groupIds: [] },
      today: TODAY,
    });
    expect(ids(result.recent)).toEqual(['a']);
  });
});

describe('shortTheme', () => {
  it('drops a trailing parenthetical', () => {
    expect(shortTheme('Declaration (Victorious/Kingdom)')).toBe('Declaration');
    expect(shortTheme('Hope')).toBe('Hope');
  });
});
