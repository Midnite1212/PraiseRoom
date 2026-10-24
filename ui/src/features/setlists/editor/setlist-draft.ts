import { conventionalKey, signedSemitones } from '@/features/chords/key-spelling';
import { keyLabel, parseKey } from '@/features/chords/theory';
import type { SongSummary } from '@/features/songs/api';
import { moveItem } from '@/lib/move-item';

import { noteForSong, type Setlist, type SetlistInput } from '../api';
import { fromDateInputValue, toDateInputValue } from '../format-date';

export type DraftSong = {
  _id: string;
  title: string;
  artist: string;
  originalKey: string;
  tempo: string[];
  // The key this set plays the song in.
  key: string;
  // A line for the team about this song in this set; '' for none.
  note: string;
};

export type SetlistDraft = {
  name: string;
  // `YYYY-MM-DD`, or '' for no date.
  date: string;
  songs: DraftSong[];
  groupIds: string[];
};

export const NEW_SETLIST_INPUT: SetlistInput = {
  name: '',
  date: null,
  songs: [],
  songKeys: [],
  songNotes: [],
  groupIds: [],
};

export const draftFromSetlist = (
  setlist: Pick<Setlist, 'name' | 'date' | 'groupIds' | 'songs' | 'songKeys' | 'songNotes'>
): SetlistDraft => ({
  name: setlist.name,
  date: toDateInputValue(setlist.date),
  groupIds: setlist.groupIds,
  songs: setlist.songs.map((song) => ({
    _id: song._id,
    title: song.title,
    artist: song.artist,
    originalKey: song.originalKey,
    tempo: song.tempo,
    key: setlist.songKeys.find(({ songId }) => songId === song._id)?.key ?? song.originalKey,
    note: noteForSong(setlist, song._id),
  })),
});

// Only keys that differ from the song's own key are stored, matching how the API reads `songKeys`.
export const toSongKeys = (songs: readonly DraftSong[]) =>
  songs.flatMap(({ _id, key, originalKey }) => {
    const chosen = parseKey(key);
    const original = parseKey(originalKey);
    return chosen && original && chosen.root !== original.root ? [{ songId: _id, key }] : [];
  });

export const toSongNotes = (songs: readonly DraftSong[]) =>
  songs.flatMap(({ _id, note }) =>
    note.trim() === '' ? [] : [{ songId: _id, note: note.trim() }]
  );

export const draftToInput = (draft: SetlistDraft): SetlistInput => ({
  name: draft.name.trim(),
  date: fromDateInputValue(draft.date),
  songs: draft.songs.map(({ _id }) => _id),
  songKeys: toSongKeys(draft.songs),
  songNotes: toSongNotes(draft.songs),
  groupIds: draft.groupIds,
});

export const hasName = (draft: SetlistDraft): boolean => draft.name.trim() !== '';

// Two drafts are the same when they would save the same thing.
export const isSameDraft = (a: SetlistDraft, b: SetlistDraft): boolean =>
  JSON.stringify(draftToInput(a)) === JSON.stringify(draftToInput(b));

export const toDraftSong = (song: SongSummary): DraftSong => ({
  _id: song._id,
  title: song.title,
  artist: song.artist,
  originalKey: song.originalKey,
  tempo: song.tempo,
  key: song.originalKey,
  note: '',
});

export const addSong = (draft: SetlistDraft, song: SongSummary): SetlistDraft =>
  draft.songs.some(({ _id }) => _id === song._id)
    ? draft
    : { ...draft, songs: [...draft.songs, toDraftSong(song)] };

export const removeSong = (draft: SetlistDraft, songId: string): SetlistDraft => ({
  ...draft,
  songs: draft.songs.filter(({ _id }) => _id !== songId),
});

export const reorderSongs = (draft: SetlistDraft, songs: DraftSong[]): SetlistDraft => ({
  ...draft,
  songs,
});

export const moveSong = (draft: SetlistDraft, from: number, to: number): SetlistDraft => ({
  ...draft,
  songs: moveItem(draft.songs, from, to),
});

// Steps the key one semitone, spelled the way that key is usually written (Bb, not A#).
export const stepSongKey = (draft: SetlistDraft, songId: string, step: 1 | -1): SetlistDraft => ({
  ...draft,
  songs: draft.songs.map((song) => {
    const current = parseKey(song.key);
    if (song._id !== songId || !current) return song;
    return { ...song, key: keyLabel(conventionalKey(current.root + step, current.isMinor)) };
  }),
});

export const setSongNote = (draft: SetlistDraft, songId: string, note: string): SetlistDraft => ({
  ...draft,
  songs: draft.songs.map((song) => (song._id === songId ? { ...song, note } : song)),
});

export const toggleFolder = (draft: SetlistDraft, folderId: string): SetlistDraft => ({
  ...draft,
  groupIds: draft.groupIds.includes(folderId)
    ? draft.groupIds.filter((id) => id !== folderId)
    : [...draft.groupIds, folderId],
});

// Semitones the set's key sits from the song's own key, the short way round (-5 to +6).
export const keyOffset = (song: DraftSong): number => {
  const chosen = parseKey(song.key);
  const original = parseKey(song.originalKey);
  return chosen && original ? signedSemitones(original, chosen) : 0;
};

// The key change into this song from the one before it; 0 for the first song and for no change.
export const keyJump = (songs: readonly DraftSong[], index: number): number => {
  const previous = songs[index - 1];
  const current = songs[index];
  if (!previous || !current) return 0;
  const from = parseKey(previous.key);
  const to = parseKey(current.key);
  return from && to ? signedSemitones(from, to) : 0;
};
