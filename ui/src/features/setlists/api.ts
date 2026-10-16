import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { apiRequest } from '@/lib/api-client';

const setlistSongSchema = z.object({
  _id: z.string(),
  title: z.string(),
  artist: z.string(),
  originalKey: z.string(),
  chordLyrics: z.string(),
  code: z.string().nullish(),
  year: z.string().nullish(),
  tempo: z.array(z.string()),
  timeSignature: z.array(z.string()),
  themes: z.array(z.string()),
});

export type SetlistSong = z.infer<typeof setlistSongSchema>;

const songKeySchema = z.object({ songId: z.string(), key: z.string() });

export const setlistSchema = z.object({
  _id: z.string(),
  name: z.string(),
  date: z.string().nullish(),
  publicLink: z.string().nullish(),
  songs: z.array(setlistSongSchema),
  songKeys: z.array(songKeySchema),
});

export type Setlist = z.infer<typeof setlistSchema>;

const setlistSummarySchema = z.object({
  _id: z.string(),
  name: z.string(),
  date: z.string().nullish(),
  songs: z.array(z.object({ _id: z.string() })),
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
