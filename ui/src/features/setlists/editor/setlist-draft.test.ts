import { describe, expect, it } from 'vitest';

import {
  addSong,
  type DraftSong,
  draftFromSetlist,
  draftToInput,
  hasName,
  isSameDraft,
  keyJump,
  keyOffset,
  moveSong,
  removeSong,
  type SetlistDraft,
  setSongNote,
  stepSongKey,
  toggleFolder,
  toSongKeys,
  toSongNotes,
} from './setlist-draft';

const song = (id: string, originalKey: string, key = originalKey): DraftSong => ({
  _id: id,
  title: id,
  artist: 'Artist',
  originalKey,
  tempo: ['Medium'],
  key,
  note: '',
});

const draft = (songs: DraftSong[] = []): SetlistDraft => ({
  name: 'Sunday',
  date: '2026-11-01',
  songs,
  groupIds: [],
});

describe('draftFromSetlist', () => {
  it('uses the stored key for a song and falls back to its own key', () => {
    const result = draftFromSetlist({
      name: 'Set',
      date: null,
      groupIds: ['f1'],
      songs: [
        {
          _id: 'a',
          title: 'A',
          artist: 'X',
          originalKey: 'G',
          chordLyrics: '',
          tempo: ['Fast'],
          timeSignature: [],
          themes: [],
        },
        {
          _id: 'b',
          title: 'B',
          artist: 'X',
          originalKey: 'C',
          chordLyrics: '',
          tempo: [],
          timeSignature: [],
          themes: [],
        },
      ],
      songKeys: [{ songId: 'a', key: 'A' }],
      songNotes: [{ songId: 'b', note: 'Acapella last chorus' }],
    });
    expect(result.songs.map(({ key }) => key)).toEqual(['A', 'C']);
    expect(result.songs.map(({ note }) => note)).toEqual(['', 'Acapella last chorus']);
    expect(result.songs[0]?.tempo).toEqual(['Fast']);
    expect(result.date).toBe('');
    expect(result.groupIds).toEqual(['f1']);
  });
});

describe('song notes', () => {
  it('sets the note on one song and leaves the others', () => {
    const next = setSongNote(draft([song('a', 'G'), song('b', 'D')]), 'b', 'Key change');
    expect(next.songs.map(({ note }) => note)).toEqual(['', 'Key change']);
  });

  it('sends trimmed notes for the songs that have one', () => {
    const noted = [
      { ...song('a', 'G'), note: '  Slow  ' },
      { ...song('b', 'D'), note: '   ' },
      song('c', 'C'),
    ];
    expect(toSongNotes(noted)).toEqual([{ songId: 'a', note: 'Slow' }]);
    expect(draftToInput(draft(noted)).songNotes).toEqual([{ songId: 'a', note: 'Slow' }]);
  });

  it('treats a trailing space in a note as no change', () => {
    const base = draft([song('a', 'G')]);
    expect(isSameDraft(setSongNote(base, 'a', 'Slow'), setSongNote(base, 'a', 'Slow '))).toBe(true);
    expect(isSameDraft(base, setSongNote(base, 'a', 'Slow'))).toBe(false);
  });
});

describe('toSongKeys', () => {
  it('stores only keys that differ from the original', () => {
    expect(toSongKeys([song('a', 'G'), song('b', 'G', 'A'), song('c', 'Bb', 'A#')])).toEqual([
      { songId: 'b', key: 'A' },
    ]);
  });
});

describe('draftToInput', () => {
  it('trims the name, converts the date and lists song ids with changed keys', () => {
    const input = draftToInput({
      ...draft([song('a', 'G', 'A'), song('b', 'D')]),
      name: '  Sunday  ',
      groupIds: ['f1'],
    });
    expect(input.name).toBe('Sunday');
    expect(input.date).toBe(new Date('2026-11-01T00:00:00').toISOString());
    expect(input.songs).toEqual(['a', 'b']);
    expect(input.songKeys).toEqual([{ songId: 'a', key: 'A' }]);
    expect(input.groupIds).toEqual(['f1']);
  });

  it('sends null for no date', () => {
    expect(draftToInput({ ...draft(), date: '' }).date).toBeNull();
  });
});

describe('hasName and isSameDraft', () => {
  it('needs a name that is not only spaces', () => {
    expect(hasName({ ...draft(), name: '   ' })).toBe(false);
    expect(hasName(draft())).toBe(true);
  });

  it('ignores whitespace around the name but not real changes', () => {
    expect(isSameDraft(draft(), { ...draft(), name: 'Sunday ' })).toBe(true);
    expect(isSameDraft(draft(), { ...draft(), date: '' })).toBe(false);
    expect(isSameDraft(draft([song('a', 'G')]), draft([song('a', 'G', 'A')]))).toBe(false);
  });
});

describe('editing songs', () => {
  const summary = {
    _id: 'n',
    urlKey: 'k3x9p2',
    title: 'N',
    artist: 'X',
    originalKey: 'E',
    tempo: ['Slow'],
    timeSignature: [],
    themes: [],
  };

  it('adds a song once, in its own key, at the end', () => {
    const added = addSong(draft([song('a', 'G')]), summary);
    expect(added.songs.map(({ _id }) => _id)).toEqual(['a', 'n']);
    expect(added.songs[1]?.key).toBe('E');
    expect(addSong(added, summary)).toBe(added);
  });

  it('removes and moves songs', () => {
    const base = draft([song('a', 'G'), song('b', 'D'), song('c', 'A')]);
    expect(removeSong(base, 'b').songs.map(({ _id }) => _id)).toEqual(['a', 'c']);
    expect(moveSong(base, 0, 2).songs.map(({ _id }) => _id)).toEqual(['b', 'c', 'a']);
  });

  it('toggles a folder link', () => {
    const linked = toggleFolder(draft(), 'f1');
    expect(linked.groupIds).toEqual(['f1']);
    expect(toggleFolder(linked, 'f1').groupIds).toEqual([]);
  });
});

describe('stepSongKey', () => {
  it('moves one semitone and spells the key the way it is usually written', () => {
    const base = draft([song('a', 'G'), song('b', 'Em')]);
    expect(stepSongKey(base, 'a', 1).songs[0]?.key).toBe('Ab');
    expect(stepSongKey(base, 'a', -1).songs[0]?.key).toBe('F#');
    expect(stepSongKey(base, 'b', 1).songs[1]?.key).toBe('Fm');
  });

  it('wraps around the octave and leaves other songs alone', () => {
    const base = draft([song('a', 'B'), song('b', 'C')]);
    const stepped = stepSongKey(base, 'a', 1);
    expect(stepped.songs[0]?.key).toBe('C');
    expect(stepped.songs[1]).toBe(base.songs[1]);
  });

  it('keeps a key it cannot read', () => {
    const base = draft([song('a', 'G', '?')]);
    expect(stepSongKey(base, 'a', 1)).toEqual(base);
  });
});

describe('keyOffset', () => {
  it('is the signed distance from the original key', () => {
    expect(keyOffset(song('a', 'G'))).toBe(0);
    expect(keyOffset(song('a', 'G', 'A'))).toBe(2);
    expect(keyOffset(song('a', 'G', 'F'))).toBe(-2);
    expect(keyOffset(song('a', 'G', '?'))).toBe(0);
  });
});

describe('keyJump', () => {
  const songs = [song('a', 'G'), song('b', 'G', 'A'), song('c', 'C', 'A'), song('d', 'D', 'F')];

  it('is 0 for the first song and when the key stays', () => {
    expect(keyJump(songs, 0)).toBe(0);
    expect(keyJump(songs, 2)).toBe(0);
  });

  it('is the signed change from the previous song in the set', () => {
    expect(keyJump(songs, 1)).toBe(2);
    expect(keyJump(songs, 3)).toBe(-4);
  });
});
