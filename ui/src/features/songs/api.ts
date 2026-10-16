import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { readerSongSchema } from '@/features/reader/song';
import { apiRequest } from '@/lib/api-client';

export const SONGS_PAGE_SIZE = 20;

export const TEMPO_OPTIONS = ['Fast', 'Medium', 'Slow', 'Medium Slow'] as const;

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
  code: z.string().nullish(),
});

export type SongSummary = z.infer<typeof songSummarySchema>;

const songSearchResponseSchema = z.object({
  data: z.array(songSummarySchema),
  totalCount: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
});

export type SongSearch = {
  keyword: string;
  page: number;
  tempo?: readonly string[];
  themes?: readonly string[];
};

export const songSearchQueryOptions = ({ keyword, page, tempo = [], themes = [] }: SongSearch) =>
  queryOptions({
    queryKey: ['songs', 'search', { keyword, page, tempo, themes }],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/search', songSearchResponseSchema, {
        query: { keyword: keyword || undefined, page, limit: SONGS_PAGE_SIZE, tempo, themes },
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
