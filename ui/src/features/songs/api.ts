import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { readerSongSchema } from '@/features/reader/song';
import { apiRequest } from '@/lib/api-client';
import { withUrlKey } from '@/lib/slug';

import { keyFilterSpellings } from './key-options';

export const SONGS_PAGE_SIZE = 20;

export const TEMPO_OPTIONS = ['Fast', 'Medium', 'Slow', 'Medium Slow'] as const;

export const TEMPO_LABEL_KEYS = {
  Fast: 'songs.tempo.fast',
  Medium: 'songs.tempo.medium',
  Slow: 'songs.tempo.slow',
  'Medium Slow': 'songs.tempo.mediumSlow',
} as const;

export const THEME_SUGGEST_MAX_CHARS = 30000;

export const songSummarySchema = z.object({
  _id: z.string(),
  urlKey: z.string(),
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

export type SongListSearch = Omit<SongSearch, 'page'>;

const songListQuery = (
  { keyword, tempo = [], themes = [], sort = 'title', dir = 'asc', keys = [] }: SongListSearch,
  page: number
) => ({
  keyword: keyword || undefined,
  page,
  limit: SONGS_PAGE_SIZE,
  tempo,
  themes,
  keys: keyFilterSpellings(keys),
  sortBy: sort === 'title' ? undefined : sort,
  order: dir === 'desc' ? 'desc' : undefined,
});

export const songSearchQueryOptions = ({ page, ...search }: SongSearch) =>
  queryOptions({
    queryKey: [
      'songs',
      'search',
      {
        keyword: search.keyword,
        page,
        tempo: search.tempo ?? [],
        themes: search.themes ?? [],
        sort: search.sort ?? 'title',
        dir: search.dir ?? 'asc',
        keys: search.keys ?? [],
      },
    ],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/search', songSearchResponseSchema, {
        query: songListQuery(search, page),
        signal,
      }),
  });

export const songListInfiniteQueryOptions = (search: SongListSearch) =>
  infiniteQueryOptions({
    queryKey: [
      'songs',
      'search',
      'list',
      {
        keyword: search.keyword,
        tempo: search.tempo ?? [],
        themes: search.themes ?? [],
        sort: search.sort ?? 'title',
        dir: search.dir ?? 'asc',
        keys: search.keys ?? [],
      },
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiRequest('/api/songs/search', songSearchResponseSchema, {
        query: songListQuery(search, pageParam),
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });

export const songKeysQueryOptions = () =>
  queryOptions({
    queryKey: ['songs', 'keys'],
    queryFn: ({ signal }) => apiRequest('/api/songs/keys', z.array(z.string()), { signal }),
  });

export const songThemesQueryOptions = () =>
  queryOptions({
    queryKey: ['songs', 'themes'],
    queryFn: ({ signal }) => apiRequest('/api/songs/themes', z.array(z.string()), { signal }),
    staleTime: Infinity,
  });

const themeSuggestionsSchema = z.object({ themes: z.array(z.string()) });

export type ThemeSuggestInput = { title: string; chordLyrics: string };

export const suggestSongThemes = (
  { title, chordLyrics }: ThemeSuggestInput,
  signal?: AbortSignal
): Promise<z.infer<typeof themeSuggestionsSchema>> =>
  apiRequest('/api/songs/themes/suggest', themeSuggestionsSchema, {
    method: 'POST',
    body: { title, chordLyrics },
    signal,
  });

export const themeSuggestionsQueryOptions = (input: ThemeSuggestInput) =>
  queryOptions({
    queryKey: ['songs', 'theme-suggestions', input],
    queryFn: ({ signal }) => suggestSongThemes(input, signal),
    enabled:
      (input.title.trim() !== '' || input.chordLyrics.trim() !== '') &&
      input.title.length <= THEME_SUGGEST_MAX_CHARS &&
      input.chordLyrics.length <= THEME_SUGGEST_MAX_CHARS,
    staleTime: Infinity,
    retry: false,
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

const LIBRARY_PAGE_SIZE = 100;
const LIBRARY_MAX_PAGES = 10;

// Every song, for features that rank the whole library on the client. Capped at 1,000 songs.
export const songLibraryQueryOptions = () =>
  queryOptions({
    queryKey: ['songs', 'library'],
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      const fetchPage = (page: number) =>
        apiRequest('/api/songs/search', songSearchResponseSchema, {
          query: { page, limit: LIBRARY_PAGE_SIZE },
          signal,
        });
      const first = await fetchPage(1);
      const lastPage = Math.min(first.totalPages, LIBRARY_MAX_PAGES);
      const rest = await Promise.all(
        Array.from({ length: Math.max(lastPage - 1, 0) }, (_, index) => fetchPage(index + 2))
      );
      return [first, ...rest].flatMap((page) => page.data);
    },
  });

export const songSchema = readerSongSchema.extend({
  urlKey: z.string(),
  recommendedKeys: z.array(z.string()),
});

export type Song = z.infer<typeof songSchema>;

export const songQueryOptions = (urlKey: string) =>
  queryOptions({
    queryKey: ['songs', 'detail', urlKey],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/get', songSchema, { query: { key: urlKey }, signal }),
  });

export const songSlug = (song: { title: string; urlKey: string }): string =>
  withUrlKey(song.title, song.urlKey);

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
  themes: string[];
  code: string | null;
  year: string | null;
  capo: number | null;
  credits: string | null;
};

const updatedSongSchema = z.object({ _id: z.string() });

export const updateSong = (songId: string, input: SongInput) =>
  apiRequest('/api/songs/update', updatedSongSchema, {
    method: 'PUT',
    body: { id: songId, ...input },
  });
