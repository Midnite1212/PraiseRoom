import type { FetchQueryOptions, QueryClient, QueryKey } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';

import { ApiError } from './api-client';
import { urlKeyFromSlug } from './slug';

// Route loaders: a bad or missing id (400 or 404 from the API) shows the not-found screen. `fresh` always asks
// the server instead of trusting cached data, for screens that edit from what they load.
export const ensureOrNotFound = async <T, TKey extends QueryKey>(
  queryClient: QueryClient,
  options: FetchQueryOptions<T, Error, T, TKey>,
  { fresh = false }: { fresh?: boolean } = {}
): Promise<T> => {
  try {
    return fresh
      ? await queryClient.fetchQuery({ ...options, staleTime: 0 })
      : await queryClient.ensureQueryData(options);
  } catch (error: unknown) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {
      throw notFound();
    }
    throw error;
  }
};

// Detail routes whose path param is `<name>-<urlKey>`; the name part is never checked.
export const ensureFromSlug = async <T, TKey extends QueryKey>(
  queryClient: QueryClient,
  slug: string,
  optionsFor: (urlKey: string) => FetchQueryOptions<T, Error, T, TKey>,
  { fresh = false }: { fresh?: boolean } = {}
): Promise<{ urlKey: string; record: T }> => {
  const urlKey = urlKeyFromSlug(slug);
  if (!urlKey) throw notFound();
  return { urlKey, record: await ensureOrNotFound(queryClient, optionsFor(urlKey), { fresh }) };
};
