import type { FetchQueryOptions, QueryClient, QueryKey } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';

import { ApiError } from './api-client';

// Route loaders: a bad or missing id (400 or 404 from the API) shows the not-found screen.
export const ensureOrNotFound = async <T, TKey extends QueryKey>(
  queryClient: QueryClient,
  options: FetchQueryOptions<T, Error, T, TKey>
): Promise<T> => {
  try {
    return await queryClient.ensureQueryData(options);
  } catch (error: unknown) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {
      throw notFound();
    }
    throw error;
  }
};
