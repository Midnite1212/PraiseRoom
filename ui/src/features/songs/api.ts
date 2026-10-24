import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { readerSongSchema } from '@/features/reader/song';
import { apiRequest } from '@/lib/api-client';

import { keyFilterSpellings } from './key-options';

export const SONGS_PAGE_SIZE = 20;

export const TEMPO_OPTIONS = ['Fast', 'Medium', 'Slow', 'Medium Slow'] as const;

export const TEMPO_LABEL_KEYS = {
  Fast: 'songs.tempo.fast',
  Medium: 'songs.tempo.medium',
  Slow: 'songs.tempo.slow',
  'Medium Slow': 'songs.tempo.mediumSlow',
} as const;

export const THEME_OPTIONS = [
  'Attributes of God',
  'Declaration (Victorious/Kingdom)',
  'Call to Worship',
  'Celebration',
  'Church / Unity',
  'Dependence',
  'Freedom / Overcoming Sin',
  "God's Faithfulness",
  "God's Presence",
  'Holiness / Purity',
  'Holy Spirit',
  'Hope',
  'Intimacy / Love for God',
  'Missions / Evangelism',
  'Obedience / Trust',
  'Prayer',
  'Purpose/Destiny',
  'Repentance',
  'Resurrection',
  'Surrender / Sacrifice',
  'Thankfulness/Gratitude',
  'The Cross',
  'Worship / Adoration / Praise',
] as const;

export const songSummarySchema = z.object({
  _id: z.string(),
  title: z.string(),
  artist: z.string(),
  originalKey: z.string(),
  tempo: z.array(z.string()),
  timeSignature: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  code: z.string().nullish(),
});

export type SongSummary = z.infer<typeof songSummarySchema>;

const songSearchResponseSchema = z.object({
  data: z.array(songSummarySchema),
  totalCount: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
});

export const SONG_SORTS = ['title', 'key', 'tempo', 'code'] as const;

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type SongSort = (typeof SONG_SORTS)[number];

export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export type SongSearch = {
  keyword: string;
  page: number;
  sort?: SongSort;
  dir?: SortDirection;
  keys?: readonly string[];
  tempo?: readonly string[];
  themes?: readonly string[];
};

export const songSearchQueryOptions = ({
  keyword,
  page,
  tempo = [],
  themes = [],
  sort = 'title',
  dir = 'asc',
  keys = [],
}: SongSearch) =>
  queryOptions({
    queryKey: ['songs', 'search', { keyword, page, tempo, themes, sort, dir, keys }],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/search', songSearchResponseSchema, {
        query: {
          keyword: keyword || undefined,
          page,
          limit: SONGS_PAGE_SIZE,
          tempo,
          themes,
          keys: keyFilterSpellings(keys),
          sortBy: sort === 'title' ? undefined : sort,
          order: dir === 'desc' ? 'desc' : undefined,
        },
        signal,
      }),
  });

export const songKeysQueryOptions = () =>
  queryOptions({
    queryKey: ['songs', 'keys'],
    queryFn: ({ signal }) => apiRequest('/api/songs/keys', z.array(z.string()), { signal }),
  });

export const RECENT_SONGS_COUNT = 3;

export const recentSongsQueryOptions = () =>
  queryOptions({
    queryKey: ['songs', 'search', 'recent'],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/search', songSearchResponseSchema, {
        query: { page: 1, limit: RECENT_SONGS_COUNT, sortBy: 'recent' },
        signal,
      }),
  });

export const songSchema = readerSongSchema.extend({ recommendedKeys: z.array(z.string()) });

export type Song = z.infer<typeof songSchema>;

export const songQueryOptions = (songId: string) =>
  queryOptions({
    queryKey: ['songs', 'detail', songId],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/get', songSchema, { query: { id: songId }, signal }),
  });

export const songSearchInfiniteQueryOptions = (keyword: string) =>
  infiniteQueryOptions({
    queryKey: ['songs', 'search', 'infinite', { keyword }],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiRequest('/api/songs/search', songSearchResponseSchema, {
        query: { keyword: keyword || undefined, page: pageParam, limit: SONGS_PAGE_SIZE },
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });

export type SongInput = {
  title: string;
  artist: string;
  originalKey: string;
  chordLyrics: string;
  tempo: string[];
  timeSignature: string[];
  year: string | null;
  capo: number | null;
};

const updatedSongSchema = z.object({ _id: z.string() });

export const updateSong = (songId: string, input: SongInput) =>
  apiRequest('/api/songs/update', updatedSongSchema, {
    method: 'PUT',
    body: { id: songId, ...input },
  });
