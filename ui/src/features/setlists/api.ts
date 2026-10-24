import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { readerSongSchema } from '@/features/reader/song';
import { apiRequest } from '@/lib/api-client';

const setlistSongSchema = readerSongSchema;

export type SetlistSong = z.infer<typeof setlistSongSchema>;

const songKeySchema = z.object({ songId: z.string(), key: z.string() });

const songNoteSchema = z.object({ songId: z.string(), note: z.string() });

export const SONG_NOTE_MAX_LENGTH = 80;

export const setlistSchema = z.object({
  _id: z.string(),
  name: z.string(),
  date: z.string().nullish(),
  publicLink: z.string().nullish(),
  createdBy: z.string().nullish(),
  groupIds: z.array(z.string()).default([]),
  songs: z.array(setlistSongSchema),
  songKeys: z.array(songKeySchema),
  songNotes: z.array(songNoteSchema).default([]),
});

export type Setlist = z.infer<typeof setlistSchema>;

const setlistSummarySchema = z.object({
  _id: z.string(),
  name: z.string(),
  date: z.string().nullish(),
  publicLink: z.string().nullish(),
  createdBy: z.string().nullish(),
  groupIds: z.array(z.string()).default([]),
  songs: z.array(z.object({ _id: z.string(), title: z.string() })),
});

export type SetlistSummary = z.infer<typeof setlistSummarySchema>;

export const setlistsQueryOptions = () =>
  queryOptions({
    queryKey: ['setlists', 'list'],
    queryFn: ({ signal }) =>
      apiRequest('/api/setlists/get', z.array(setlistSummarySchema), { signal }),
  });

export const setlistQueryOptions = (setlistId: string) =>
  queryOptions({
    queryKey: ['setlists', 'detail', setlistId],
    queryFn: ({ signal }) =>
      apiRequest('/api/setlists/get', setlistSchema, { query: { id: setlistId }, signal }),
  });

export const keyForSong = (setlist: Setlist, song: SetlistSong): string =>
  setlist.songKeys.find(({ songId }) => songId === song._id)?.key ?? song.originalKey;

export const noteForSong = (setlist: Pick<Setlist, 'songNotes'>, songId: string): string =>
  setlist.songNotes.find((entry) => entry.songId === songId)?.note ?? '';

// Built from the current origin rather than the stored publicLink, which keeps the domain it was created on.
export const publicSetlistUrl = (setlistId: string, origin = window.location.origin): string =>
  new URL(`/setlist/view/${setlistId}`, origin).href;

export const folderSchema = z.object({
  _id: z.string(),
  groupName: z.string(),
  setlistIds: z.array(z.string()),
  createdBy: z.string().nullish(),
  createdAt: z.string().nullish(),
});

export type Folder = z.infer<typeof folderSchema>;

// The API lists every live folder; callers keep the ones their ownership record says they belong to.
export const foldersQueryOptions = () =>
  queryOptions({
    queryKey: ['folders', 'list'],
    queryFn: ({ signal }) => apiRequest('/api/groups/get', z.array(folderSchema), { signal }),
  });

export type SetlistInput = {
  name: string;
  date: string | null;
  songs: string[];
  songKeys: { songId: string; key: string }[];
  songNotes: { songId: string; note: string }[];
  groupIds: string[];
};

const savedSetlistSchema = z.object({ _id: z.string() });

export const createSetlist = (input: SetlistInput) =>
  apiRequest('/api/setlists/create', savedSetlistSchema, { method: 'POST', body: input });

export const updateSetlist = (setlistId: string, input: SetlistInput) =>
  apiRequest('/api/setlists/update', savedSetlistSchema, {
    method: 'PUT',
    body: { id: setlistId, ...input },
  });

export const deleteSetlist = (setlistId: string) =>
  apiRequest('/api/setlists/delete', z.unknown(), { method: 'PUT', body: { id: setlistId } });

export const duplicateSetlist = (setlistId: string, name: string) =>
  apiRequest('/api/setlists/duplicate', savedSetlistSchema, {
    method: 'POST',
    body: { id: setlistId, name },
  });

export const setSetlistSongs = (setlistId: string, songs: string[]) =>
  apiRequest('/api/setlists/update', savedSetlistSchema, {
    method: 'PUT',
    body: { id: setlistId, songs },
  });

export const setSetlistFolders = (setlistId: string, groupIds: string[]) =>
  apiRequest('/api/setlists/update', savedSetlistSchema, {
    method: 'PUT',
    body: { id: setlistId, groupIds },
  });
