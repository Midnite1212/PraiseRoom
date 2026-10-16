import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { apiRequest } from '@/lib/api-client';

export const SONGS_PAGE_SIZE = 20;

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

export type SongSearch = { keyword: string; page: number };

export const songSearchQueryOptions = ({ keyword, page }: SongSearch) =>
  queryOptions({
    queryKey: ['songs', 'search', { keyword, page }],
    queryFn: ({ signal }) =>
      apiRequest('/api/songs/search', songSearchResponseSchema, {
        query: { keyword: keyword || undefined, page, limit: SONGS_PAGE_SIZE },
        signal,
      }),
  });
