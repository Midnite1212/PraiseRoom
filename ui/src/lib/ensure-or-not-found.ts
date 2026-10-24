import type { FetchQueryOptions, QueryClient, QueryKey } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';

import { ApiError } from './api-client';

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
