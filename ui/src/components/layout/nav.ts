import type { QueryClient } from '@tanstack/react-query';
import { Bulletlist, Folder, Home, Music } from 'pixelarticons/react';

import type { Session } from '@/features/auth/session';
import { foldersQueryOptions, setlistsQueryOptions } from '@/features/setlists/api';
import { ownFolders } from '@/features/setlists/permissions';
import { songSearchQueryOptions } from '@/features/songs/api';
import { useCachedQueryData } from '@/hooks/use-cached-query-data';

export const NAV_ITEMS = [
  { id: 'home', to: '/', labelKey: 'nav.home', icon: Home },
  { id: 'songs', to: '/songs', labelKey: 'nav.songs', icon: Music },
  { id: 'setlists', to: '/setlists', labelKey: 'nav.setlists', icon: Bulletlist },
  { id: 'folders', to: '/folders', labelKey: 'nav.folders', icon: Folder },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]['id'];

const librarySearch = songSearchQueryOptions({ keyword: '', page: 1 });

// Warms the caches the rail's counts read; called from the signed-in layout's loader.
export const prefetchNavCounts = (queryClient: QueryClient) => {
  void queryClient.prefetchQuery(librarySearch);
  void queryClient.prefetchQuery(setlistsQueryOptions());
  void queryClient.prefetchQuery(foldersQueryOptions());
};

// How many songs, setlists and folders each page holds, shown beside the rail's links.
export const useNavCounts = (session: Session): Partial<Record<NavId, number>> => {
  const songs = useCachedQueryData(librarySearch.queryKey);
  const setlists = useCachedQueryData(setlistsQueryOptions().queryKey);
  const folders = useCachedQueryData(foldersQueryOptions().queryKey);
  return {
    songs: songs?.totalCount,
    setlists: setlists?.length,
    folders: folders ? ownFolders(session, folders).length : undefined,
  };
};
