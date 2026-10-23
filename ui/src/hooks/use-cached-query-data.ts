import { type QueryKey, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

// Reads a query's cached data and follows its changes without becoming an observer, so it never starts a
// fetch and never cancels one that a route loader is awaiting.
export const useCachedQueryData = <TKey extends QueryKey>(queryKey: TKey) => {
  const queryClient = useQueryClient();
  return useSyncExternalStore(
    (onChange) => queryClient.getQueryCache().subscribe(onChange),
    () => queryClient.getQueryData(queryKey),
    () => undefined
  );
};
