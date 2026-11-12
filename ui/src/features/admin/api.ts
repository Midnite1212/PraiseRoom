import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { apiRequest } from '@/lib/api-client';

export const ASSIGNABLE_ACCESS_TYPES = ['member', 'editor', 'admin'] as const;

export type AssignableAccessType = (typeof ASSIGNABLE_ACCESS_TYPES)[number];

// Super is granted outside the app, by a script that refuses a fourth.
export const MAX_SUPERS = 3;

const REVIEW_PAGE_SIZE = 50;

const reviewSongSchema = z.object({
  _id: z.string(),
  urlKey: z.string(),
  title: z.string(),
  artist: z.string(),
  isVerified: z.boolean().default(false),
});

export type ReviewSong = z.infer<typeof reviewSongSchema>;

const reviewPageSchema = z.object({
  data: z.array(reviewSongSchema),
  currentPage: z.number(),
  totalPages: z.number(),
});

// Unverified songs first, then by title.
export const songReviewInfiniteQueryOptions = (keyword: string) =>
  infiniteQueryOptions({
    queryKey: ['songs', 'search', 'review', { keyword }],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiRequest('/api/songs/search', reviewPageSchema, {
        query: {
          keyword: keyword || undefined,
          sortBy: 'verified',
          page: pageParam,
          limit: REVIEW_PAGE_SIZE,
        },
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });

export const setSongVerified = ({ id, isVerified }: { id: string; isVerified: boolean }) =>
  apiRequest('/api/songs/verify', reviewSongSchema, {
    method: 'PUT',
    body: { id, isVerified },
  });

const memberSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  accessType: z.string(),
});

export type Member = z.infer<typeof memberSchema>;

export const membersQueryOptions = () =>
  queryOptions({
    queryKey: ['ownerships', 'members'],
    queryFn: ({ signal }) =>
      apiRequest('/api/ownerships/members', z.array(memberSchema), { signal }),
  });

export const setMemberAccessType = ({
  userId,
  accessType,
}: {
  userId: string;
  accessType: AssignableAccessType;
}) =>
  apiRequest('/api/ownerships/access-type', memberSchema, {
    method: 'PUT',
    body: { userId, accessType },
  });
