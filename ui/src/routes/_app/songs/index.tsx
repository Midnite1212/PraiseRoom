import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'pixelarticons/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { EmptyState } from '@/components/page/empty-state';
import { type ActiveFilter, FilterChips } from '@/components/page/filter-chips';
import { Finder } from '@/components/page/finder';
import { GroupTitle } from '@/components/page/group-title';
import { LoadingStatus } from '@/components/page/loading-status';
import { PageHeader } from '@/components/page/page-header';
import { useSlideOver } from '@/components/page/slide-over';
import { Fab } from '@/components/primitives/fab';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { canWriteSongs } from '@/features/auth/session';
import { setlistsQueryOptions } from '@/features/setlists/api';
import { useSongImport } from '@/features/song-import/use-song-import';
import { WebResults } from '@/features/song-import/web-results';
import { AddSongDialog } from '@/features/songs/add-song-dialog';
import {
  SONG_SORTS,
  SORT_DIRECTIONS,
  songKeysQueryOptions,
  songListInfiniteQueryOptions,
  songSearchQueryOptions,
  type SongSort,
  TEMPO_LABEL_KEYS,
  TEMPO_OPTIONS,
} from '@/features/songs/api';
import { KEY_FILTER_OPTIONS, tonicOf } from '@/features/songs/key-options';
import { nextSetSongIds } from '@/features/songs/next-set';
import { type SongFilterValues, SongFilterSheet } from '@/features/songs/song-filter-sheet';
import { SongPreview } from '@/features/songs/song-preview';
import { SongRows } from '@/features/songs/song-rows';
import { MAX_KEYWORD_LENGTH, toSearchKeyword } from '@/features/songs/song-search';
import { SongsTable } from '@/features/songs/songs-table';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useNearEnd } from '@/hooks/use-near-end';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

const songsSearchSchema = z.object({
  q: z.string().default('').catch(''),
  tempo: z.array(z.string()).default([]).catch([]),
  themes: z.array(z.string()).default([]).catch([]),
  keys: z.array(z.enum(KEY_FILTER_OPTIONS)).default([]).catch([]),
  web: z.boolean().default(false).catch(false),
  sort: z.enum(SONG_SORTS).default('title').catch('title'),
  dir: z.enum(SORT_DIRECTIONS).default('asc').catch('asc'),
  song: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/_app/songs/')({
  validateSearch: songsSearchSchema,
  loaderDeps: ({ search: { q, tempo, themes, keys, sort, dir } }) => ({
    q,
    tempo,
    themes,
    keys,
    sort,
    dir,
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureInfiniteQueryData(
      songListInfiniteQueryOptions({
        keyword: deps.q,
        tempo: deps.tempo,
        themes: deps.themes,
        keys: deps.keys,
        sort: deps.sort,
        dir: deps.dir,
      })
    );
    return { now: Date.now() };
  },
  pendingComponent: SongsPending,
  component: SongsPage,
});

const isTempo = (value: string): value is (typeof TEMPO_OPTIONS)[number] =>
  TEMPO_OPTIONS.some((option) => option === value);

function SongsPage() {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const { now } = Route.useLoaderData();
  const search = Route.useSearch();
  const { q, tempo, themes, keys, web, sort, dir, song: selectedId } = search;
  const navigate = Route.useNavigate();
  const isWide = useIsWide();
  const searchInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(q);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const songImport = useSongImport();
  const { data, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      ...songListInfiniteQueryOptions({ keyword: q, tempo, themes, keys, sort, dir }),
      placeholderData: keepPreviousData,
    });
  const endRef = useRef<HTMLDivElement>(null);
  useNearEnd(endRef, {
    enabled: hasNextPage && !isFetching,
    onNear: () => void fetchNextPage(),
  });

  const { data: library } = useQuery(songSearchQueryOptions({ keyword: '', page: 1 }));
  const { data: libraryKeys } = useQuery(songKeysQueryOptions());
  const availableKeys = libraryKeys
    ? new Set(libraryKeys.flatMap((key) => tonicOf(key) ?? []))
    : undefined;
  const { data: setlists } = useQuery(setlistsQueryOptions());
  const nextSetSongs = nextSetSongIds(setlists ?? [], now);

  const canAdd = canWriteSongs(session);
  const setSearch = (next: Partial<typeof search>) =>
    void navigate({ search: (previous) => ({ ...previous, ...next }), replace: true });

  // The list follows the search box as you type, once typing pauses.
  const keyword = toSearchKeyword(useDebouncedValue(text, 300));
  useEffect(() => {
    if (keyword !== q)
      void navigate({
        search: (previous) => ({ ...previous, q: keyword }),
        replace: true,
      });
  }, [keyword, q, navigate]);

  const changeFilters = (filters: Partial<SongFilterValues>) => setSearch(filters);
  const activeFilters: ActiveFilter[] = [
    ...tempo.map((value) => ({
      key: `tempo-${value}`,
      label: isTempo(value) ? t(TEMPO_LABEL_KEYS[value]) : value,
      onRemove: () => changeFilters({ tempo: tempo.filter((item) => item !== value) }),
    })),
    ...themes.map((value) => ({
      key: `theme-${value}`,
      label: value,
      onRemove: () => changeFilters({ themes: themes.filter((item) => item !== value) }),
    })),
    ...keys.map((value) => ({
      key: `key-${value}`,
      label: t('songs.filters.keyChip', { key: value }),
      onRemove: () => changeFilters({ keys: keys.filter((item) => item !== value) }),
    })),
    ...(web && canAdd
      ? [
          {
            key: 'web',
            label: t('songs.webResults'),
            onRemove: () => changeFilters({ web: false }),
          },
        ]
      : []),
  ];

  const songs = data?.pages.flatMap((result) => result.data) ?? [];
  const totalCount = data?.pages[0]?.totalCount;
  const selectedSong = isWide ? songs.find((song) => song._id === selectedId) : undefined;
  const hasStaleSelection =
    isWide && selectedId !== undefined && !selectedSong && !isFetching && data !== undefined;
  useEffect(() => {
    if (hasStaleSelection)
      void navigate({ search: (previous) => ({ ...previous, song: undefined }), replace: true });
  }, [hasStaleSelection, navigate]);

  const sortBy = (next: SongSort) =>
    setSearch({ sort: next, dir: next === sort && dir === 'asc' ? 'desc' : 'asc' });

  const closePreview = () => {
    if (selectedId) document.getElementById(`song-row-${selectedId}`)?.focus();
    setSearch({ song: undefined });
  };
  const isPreviewOpen = selectedSong !== undefined;
  const slideOver = useSlideOver(isPreviewOpen, closePreview);
  useEffect(() => {
    if (!isPreviewOpen) return undefined;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (
        event.target instanceof Element &&
        event.target.closest('input, textarea, select, [contenteditable], [role="dialog"]')
      )
        return;
      slideOver.close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
  const isFiltered = q !== '' || activeFilters.length > 0;
  const isSearching = (isFetching && !isFetchingNextPage) || toSearchKeyword(text) !== q;
  const typedKeyword = toSearchKeyword(text);
  const isSearchingKeyword = isSearching && typedKeyword !== '';
  const searchingLabel = isSearchingKeyword
    ? t('songs.searchingFor', { total: library?.totalCount ?? 0, q: typedKeyword })
    : t('songs.searching');
  const clearSearch = q === '' && text === '' ? undefined : () => setText('');
  const clearFilters =
    activeFilters.length === 0
      ? undefined
      : () => changeFilters({ tempo: [], themes: [], keys: [], web: false });
  const addSongLabel = t('songs.add.button');

  return (
    <>
      <PageHeader
        title={t('songs.title')}
        actions={
          canAdd ? (
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus />
              {addSongLabel}
            </Button>
          ) : null
        }
      />
      <div
        className={cn(
          selectedSong &&
            'roomy:grid roomy:grid-cols-[minmax(0,1fr)_25rem] roomy:items-start roomy:gap-10'
        )}
      >
        <div className="min-w-0">
          <Finder
            inputRef={searchInput}
            value={text}
            onChange={setText}
            maxLength={MAX_KEYWORD_LENGTH}
            placeholder={
              library
                ? t(isWide ? 'songs.searchWide' : 'songs.searchPhone', {
                    total: library.totalCount,
                  })
                : t('songs.searchPlaceholder')
            }
            label={t('songs.searchLabel')}
            filterCount={activeFilters.length}
            onFilter={() => setIsFilterOpen(true)}
          />
          <FilterChips filters={activeFilters} />

          <GroupTitle
            title={isFiltered ? t('songs.results') : t('songs.library')}
            count={isSearchingKeyword ? '…' : totalCount}
            hint={isWide ? t('songs.previewHint') : t(`songs.sortHint.${sort}`)}
            first
          />
          {isError ? (
            <EmptyState title={t('songs.loadFailed')} />
          ) : isSearchingKeyword || (isSearching && songs.length === 0) ? (
            <LoadingStatus>{searchingLabel}</LoadingStatus>
          ) : (
            <div className={isSearching ? 'opacity-60 transition-opacity' : undefined}>
              {isSearching ? (
                <LoadingStatus compact className="mb-2">
                  {searchingLabel}
                </LoadingStatus>
              ) : null}
              {isWide ? (
                <SongsTable
                  songs={songs}
                  selectedId={selectedSong?._id}
                  sort={sort}
                  dir={dir}
                  onSort={sortBy}
                  onSelect={(songId) => setSearch({ song: songId })}
                  onClearSearch={clearSearch}
                  onClearFilters={clearFilters}
                />
              ) : (
                <SongRows
                  songs={songs}
                  sort={sort}
                  grouped={q.trim() === ''}
                  nextSetSongIds={nextSetSongs}
                  onClearSearch={clearSearch}
                  onClearFilters={clearFilters}
                />
              )}
            </div>
          )}

          {isFetchingNextPage ? (
            <LoadingStatus compact className="mt-3">
              {t('songs.loadingMore')}
            </LoadingStatus>
          ) : null}
          <div ref={endRef} aria-hidden />

          {canAdd && web && q.trim() !== '' ? (
            <WebResults
              key={q}
              q={q}
              onPickUrl={songImport.pickUrl}
              onPaste={songImport.openPaste}
            />
          ) : null}
        </div>
        {selectedSong ? (
          <SongPreview
            key={selectedSong._id}
            song={selectedSong}
            session={session}
            canEdit={canAdd}
            slideOver={slideOver}
          />
        ) : null}
      </div>

      <SongFilterSheet
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        tempo={tempo}
        themes={themes}
        keys={keys}
        web={web}
        sort={sort}
        availableKeys={availableKeys}
        matchCount={totalCount}
        canSearchWeb={canAdd}
        onChange={changeFilters}
      />
      {canAdd ? (
        <>
          <Fab aria-label={addSongLabel} title={addSongLabel} onClick={() => setIsAddOpen(true)}>
            <Plus />
          </Fab>
          <AddSongDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            onFindOnWeb={(query) => {
              setText(query);
              setSearch({ web: true });
            }}
          />
          {songImport.element}
        </>
      ) : null}
    </>
  );
}

function SongsPending() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
