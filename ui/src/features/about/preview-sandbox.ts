import { onlineManager, type QueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';

import { folderQueryOptions, peopleQueryOptions } from '@/features/folders/api';
import {
  foldersQueryOptions,
  setlistQueryOptions,
  setlistsQueryOptions,
} from '@/features/setlists/api';
import {
  songKeysQueryOptions,
  songQueryOptions,
  songSearchQueryOptions,
  songThemesQueryOptions,
} from '@/features/songs/api';
import i18n from '@/i18n';

import {
  demoFolder,
  demoPeople,
  demoSetlists,
  demoSongs,
  toSetlistSummary,
  toSongSummary,
} from './demo-data';

export const seedDemoCache = (queryClient: QueryClient, t: TFunction, now: number): void => {
  const setlists = demoSetlists(t, now);
  const songs = demoSongs(t);
  const folder = demoFolder(t, setlists);
  queryClient.setQueryData(setlistsQueryOptions().queryKey, setlists.map(toSetlistSummary));
  for (const setlist of setlists) {
    queryClient.setQueryData(setlistQueryOptions(setlist.urlKey).queryKey, setlist);
  }
  queryClient.setQueryData(foldersQueryOptions().queryKey, [folder]);
  queryClient.setQueryData(folderQueryOptions(folder.urlKey).queryKey, folder);
  queryClient.setQueryData(peopleQueryOptions().queryKey, demoPeople(t));
  queryClient.setQueryData(songSearchQueryOptions({ keyword: '', page: 1 }).queryKey, {
    data: songs.map(toSongSummary),
    totalCount: songs.length,
    currentPage: 1,
    totalPages: 1,
  });
  for (const song of songs) {
    queryClient.setQueryData(songQueryOptions(song.urlKey).queryKey, song);
  }
  queryClient.setQueryData(songKeysQueryOptions().queryKey, [
    ...new Set(songs.map((song) => song.originalKey)),
  ]);
  queryClient.setQueryData(songThemesQueryOptions().queryKey, [
    ...new Set(songs.flatMap((song) => song.themes)),
  ]);
};

const isApiRequest = (input: RequestInfo | URL): boolean => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return new URL(url, window.location.origin).pathname.startsWith('/api');
};

let sandbox: { now: number } | null = null;

// No preview reaches the server: queries wait offline on seeded data; stray API calls are refused.
export const openPreviewSandbox = (queryClient: QueryClient): { now: number } => {
  if (sandbox) return sandbox;
  const opened = { now: Date.now() };
  sandbox = opened;
  onlineManager.setEventListener((setOnline) => {
    setOnline(false);
    return undefined;
  });
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, staleTime: Infinity, gcTime: Infinity, retry: false },
  });
  queryClient.setQueryDefaults(['chords'], { networkMode: 'always' });
  const appFetch = window.fetch.bind(window);
  window.fetch = (input, init) =>
    isApiRequest(input)
      ? Promise.reject(new TypeError('About previews make no API calls'))
      : appFetch(input, init);
  seedDemoCache(queryClient, i18n.t, opened.now);
  i18n.on('languageChanged', () => seedDemoCache(queryClient, i18n.t, opened.now));
  return opened;
};
