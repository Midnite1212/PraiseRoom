import { describe, expect, it } from 'vitest';

import type { SongSummary } from '@/features/songs/api';

import type { SetlistSummary } from '../api';
import { NEW_SONG_LIMIT, SUGGESTED_LIMIT, shortTheme, suggestSongs } from './add-suggestions';
import type { DraftSong } from './setlist-draft';

const song = (
  id: string,
  {
    themes = [],
    key = 'G',
    keys,
    createdAt,
  }: Partial<{
    themes: string[];
    key: string;
    keys: string[];
    createdAt: string;
  }> = {}
): SongSummary => ({
  _id: id,
  urlKey: 'k3x9p2',
  title: `Song ${id}`,
  artist: 'Artist',
  originalKey: key,
  recommendedKeys: keys,
  tempo: [],
  timeSignature: [],
  themes,
  createdAt,
});

const inDraft = (value: SongSummary, key = value.originalKey): DraftSong => ({
  _id: value._id,
  title: value.title,
  artist: value.artist,
  originalKey: value.originalKey,
  tempo: value.tempo,
  key,
  note: '',
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
const OLD = day('2025-01-01');

const ids = (items: { song: SongSummary }[]) => items.map((item) => item.song._id);

const run = (
  library: SongSummary[],
  draftSongs: DraftSong[] = [],
  setlists: SetlistSummary[] = [],
  groupIds: string[] = []
) =>
  suggestSongs({
    library,
    setlists,
    setlistId: 'self',
    draft: { songs: draftSongs, groupIds },
    today: TODAY,
  });

describe('suggestSongs', () => {
  it('suggests nothing for an empty set with no history or new songs', () => {
    const result = run(['a', 'b', 'c'].map((id) => song(id, { key: 'X' })));
    expect(result).toEqual({ suggested: [], fresh: [] });
  });

  it('ranks by shared themes and down-weights themes most of the library has', () => {
    const broad = 'Worship';
    const filler = ['f1', 'f2', 'f3', 'f4'].map((id) => song(id, { key: 'X', themes: [broad] }));
    const anchor = song('s', { key: 'X', themes: [broad, 'Hope', 'Prayer'] });
    const result = run(
      [
        anchor,
        ...filler,
        song('one', { key: 'X', themes: ['Hope'] }),
        song('two', { key: 'X', themes: ['Hope', 'Prayer'] }),
        song('none', { key: 'X', themes: ['Repentance'] }),
        ...['p', 'q', 'r', 't', 'u', 'v'].map((id) => song(id, { key: 'X' })),
      ],
      [inDraft(anchor)]
    );
    expect(ids(result.suggested).slice(0, 2)).toEqual(['two', 'one']);
    expect(result.suggested[0]?.sharedThemes).toEqual(['Hope', 'Prayer']);
    expect(ids(result.suggested)).not.toContain('none');
    expect(ids(result.suggested).slice(2)).toEqual(['f1', 'f2', 'f3', 'f4']);
  });

  it('scores a song playable in a set key above one in the relative key', () => {
    const anchor = song('s', { key: 'D' });
    const result = run(
      [
        anchor,
        song('relative', { key: 'Bm' }),
        song('recommended', { key: 'E', keys: ['D'] }),
        song('other', { key: 'F' }),
      ],
      [inDraft(anchor)]
    );
    expect(ids(result.suggested)).toEqual(['recommended', 'relative']);
    expect(result.suggested.map((item) => item.matchedKey)).toEqual(['D', 'Bm']);
  });

  it('matches the key the set plays a song in, not its original key', () => {
    const anchor = song('s', { key: 'G' });
    const result = run([anchor, song('a', { key: 'A' })], [inDraft(anchor, 'A')]);
    expect(ids(result.suggested)).toEqual(['a']);
  });

  it('suggests songs the folders rested, more often sung first, and holds back recent ones', () => {
    const library = ['rested', 'often', 'recent', 'never'].map((id) => song(id, { key: 'X' }));
    const result = run(
      library,
      [],
      [
        setlist('1', day('2026-03-01'), ['rested', 'often'], ['g1']),
        setlist('2', day('2026-02-01'), ['often'], ['g1']),
        setlist('3', day('2026-05-24'), ['recent'], ['g1']),
      ],
      ['g1']
    );
    expect(ids(result.suggested)).toEqual(['often', 'rested']);
    expect(result.suggested[0]?.lastSung).toBe('2026-03-01');
  });

  it('only counts history from sets in the same folders, dated before today', () => {
    const library = ['other', 'future', 'here'].map((id) => song(id, { key: 'X' }));
    const result = run(
      library,
      [],
      [
        setlist('1', day('2026-01-04'), ['other'], ['g2']),
        setlist('2', day('2026-06-01'), ['future'], ['g1']),
        setlist('3', day('2026-01-04'), ['here'], ['g1']),
        setlist('self', day('2026-01-04'), ['other'], ['g1']),
      ],
      ['g1']
    );
    expect(ids(result.suggested)).toEqual(['here']);
  });

  it('uses every set the caller can read when the set has no folder', () => {
    const result = run(
      [song('a', { key: 'X' })],
      [],
      [setlist('1', day('2026-01-04'), ['a'], ['g9'])]
    );
    expect(ids(result.suggested)).toEqual(['a']);
  });

  it('never suggests a song already in the set', () => {
    const anchor = song('s', { key: 'D', themes: ['Hope'] });
    const twin = song('t', { key: 'D', themes: ['Hope'] });
    const result = run([anchor, twin], [inDraft(anchor), inDraft(twin)]);
    expect(result.suggested).toEqual([]);
  });

  it('caps the ranked list', () => {
    const anchor = song('s', { key: 'D' });
    const library = Array.from({ length: SUGGESTED_LIMIT + 3 }, (_, index) =>
      song(`m${String(index).padStart(2, '0')}`, { key: 'D' })
    );
    expect(run([anchor, ...library], [inDraft(anchor)]).suggested).toHaveLength(SUGGESTED_LIMIT);
  });

  it('lists recently added songs no set has planned, newest first', () => {
    const library = [
      song('old', { key: 'X', createdAt: OLD }),
      song('newer', { key: 'X', createdAt: day('2026-05-20') }),
      song('newest', { key: 'X', createdAt: day('2026-05-28') }),
      song('planned', { key: 'X', createdAt: day('2026-05-29') }),
      song('undated', { key: 'X' }),
    ];
    const result = run(library, [], [setlist('later', day('2026-06-07'), ['planned'])]);
    expect(ids(result.fresh)).toEqual(['newest', 'newer']);
  });

  it('keeps a new song that already ranks out of the new group, and caps the group', () => {
    const anchor = song('s', { key: 'D' });
    const added = day('2026-05-20');
    const library = [
      anchor,
      song('fits', { key: 'D', createdAt: added }),
      ...Array.from({ length: NEW_SONG_LIMIT + 2 }, (_, index) =>
        song(`n${index}`, { key: 'X', createdAt: added })
      ),
    ];
    const result = run(library, [inDraft(anchor)]);
    expect(ids(result.suggested)).toEqual(['fits']);
    expect(ids(result.fresh)).not.toContain('fits');
    expect(result.fresh).toHaveLength(NEW_SONG_LIMIT);
  });

  it('ignores set songs missing from the library', () => {
    const result = run(
      [song('a', { key: 'X' })],
      [],
      [setlist('x', day('2026-01-04'), ['gone', 'a'])]
    );
    expect(ids(result.suggested)).toEqual(['a']);
  });
});

describe('shortTheme', () => {
  it('drops a trailing parenthetical', () => {
    expect(shortTheme('Declaration (Victorious/Kingdom)')).toBe('Declaration');
    expect(shortTheme('Hope')).toBe('Hope');
  });
});
