import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Check, Plus, Search } from 'pixelarticons/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { listRowClasses } from '@/components/page/list-row';
import { KeyTile } from '@/components/primitives/key-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type SongSummary,
  songLibraryQueryOptions,
  songSearchInfiniteQueryOptions,
} from '@/features/songs/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { dateLocale } from '@/lib/date-locale';

import { setlistsQueryOptions } from '../api';
import { toDateInputValue } from '../format-date';
import { type Suggestion, shortTheme, suggestSongs } from './add-suggestions';
import type { SetlistDraft } from './setlist-draft';

type AddPanelProps = {
  setlistId: string;
  draft: SetlistDraft;
  // `YYYY-MM-DD`
  today: string;
  onAdd: (song: SongSummary) => void;
};

const ROW_CLASSES = 'min-h-[3.75rem] grid-cols-[2.75rem_minmax(0,1fr)_auto] px-2 py-1.5';

function AddRow({
  song,
  meta,
  added,
  onAdd,
}: {
  song: SongSummary;
  meta?: string;
  added: boolean;
  onAdd: (song: SongSummary) => void;
}) {
  const { t } = useTranslation();
  return (
    <li className={listRowClasses(ROW_CLASSES)}>
      <KeyTile musicKey={song.originalKey} timeSignature={song.timeSignature[0]} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{song.title}</span>
        <span className="text-ink-2 mt-0.5 block truncate text-[0.8125rem]">
          {meta ?? song.artist}
        </span>
      </span>
      {added ? (
        <span className="text-ink-3 inline-flex items-center gap-1 pr-2 text-[0.8125rem] font-semibold">
          <Check className="size-icon" aria-hidden />
          {t('editor.added')}
        </span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="link"
          aria-label={t('editor.addSong', { title: song.title })}
          onClick={() => onAdd(song)}
        >
          <Plus />
          {t('editor.add')}
        </Button>
      )}
    </li>
  );
}

function AddGroup({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <h3 className="text-ink-2 mt-5 mb-1 ml-2 text-[0.8125rem] font-semibold">
        {title}
        {count === undefined ? null : (
          <small className="text-ink-3 ml-1.5 font-mono text-xs font-semibold">{count}</small>
        )}
      </h3>
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">{children}</ul>
    </section>
  );
}

const SkeletonRows = () =>
  Array.from({ length: 6 }, (_, index) => (
    <li key={index} className="py-1.5">
      <Skeleton className="h-11 w-full" />
    </li>
  ));

// Library search, and before anything is typed, songs ranked for this set plus new songs. All of it
// is ranked on the client from the song library and the setlists the caller can already read.
export function AddPanel({ setlistId, draft, today, onAdd }: AddPanelProps) {
  const { t, i18n } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const searching = keyword.trim() !== '';
  const search = useInfiniteQuery({
    ...songSearchInfiniteQueryOptions(debouncedKeyword),
    enabled: debouncedKeyword !== '',
  });
  const library = useQuery(songLibraryQueryOptions());
  const setlists = useQuery(setlistsQueryOptions());
  const sentinelRef = useRef<HTMLLIElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = search;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const inSet = new Set(draft.songs.map(({ _id }) => _id));
  const results = search.data?.pages.flatMap((page) => page.data) ?? [];
  const resultsPending = searching && (search.isPending || debouncedKeyword === '');
  const suggestions = suggestSongs({
    library: library.data ?? [],
    setlists: setlists.data ?? [],
    setlistId,
    draft,
    today,
  });

  const formatDay = (day: string) =>
    new Intl.DateTimeFormat(dateLocale(i18n.language), {
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${day}T00:00:00`));

  const reason = ({ sharedThemes, matchedKey, lastSung }: Suggestion): string | undefined => {
    const parts = [
      matchedKey ? t('editor.suggest.inKey', { key: matchedKey }) : '',
      lastSung ? t('editor.suggest.lastSung', { date: formatDay(lastSung) }) : '',
      sharedThemes.length > 0
        ? t('editor.suggest.themes', {
            themes: sharedThemes.slice(0, 2).map(shortTheme).join(', '),
          })
        : '',
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : undefined;
  };

  const rows = (items: Suggestion[], meta: (item: Suggestion) => string | undefined) =>
    items.map((item) => (
      <AddRow
        key={item.song._id}
        song={item.song}
        meta={meta(item)}
        added={inSet.has(item.song._id)}
        onAdd={onAdd}
      />
    ));

  const suggestionsPending = library.isPending || setlists.isPending;
  const hasSuggestions = suggestions.suggested.length + suggestions.fresh.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2">
      <div className="relative">
        <Search className="text-ink-2 size-icon pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" />
        <Input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={t('editor.suggest.search', { count: library.data?.length ?? 0 })}
          aria-label={t('editor.suggest.searchLabel')}
          className="pl-10"
        />
      </div>
      {search.isError || library.isError ? (
        <p className="text-destructive text-sm">{t('songs.loadFailed')}</p>
      ) : null}
      <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
        {searching ? (
          <AddGroup
            title={t('editor.suggest.results')}
            count={resultsPending ? undefined : results.length}
          >
            {resultsPending ? <SkeletonRows /> : null}
            {!resultsPending && results.length === 0 ? (
              <li className="text-muted-foreground py-6 text-center text-sm">
                <b className="text-ink block">{t('editor.suggest.noMatch')}</b>
                {t('editor.suggest.noMatchHint')}
              </li>
            ) : null}
            {results.map((song) => (
              <AddRow key={song._id} song={song} added={inSet.has(song._id)} onAdd={onAdd} />
            ))}
            {hasNextPage ? (
              <li ref={sentinelRef} className="py-2">
                <Skeleton className="h-11 w-full" />
              </li>
            ) : null}
          </AddGroup>
        ) : (
          <>
            {suggestionsPending ? (
              <ul className="m-0 mt-4 list-none p-0" aria-busy>
                <SkeletonRows />
              </ul>
            ) : null}
            {suggestions.suggested.length > 0 ? (
              <AddGroup title={t('editor.suggest.suggested')}>
                {rows(suggestions.suggested, reason)}
              </AddGroup>
            ) : null}
            {suggestions.fresh.length > 0 ? (
              <AddGroup title={t('editor.suggest.fresh')}>
                {rows(suggestions.fresh, ({ song }) => {
                  const added = toDateInputValue(song.createdAt);
                  return added
                    ? t('editor.suggest.addedOn', { date: formatDay(added) })
                    : undefined;
                })}
              </AddGroup>
            ) : null}
            {!suggestionsPending && !hasSuggestions && !library.isError ? (
              <p className="text-muted-foreground py-6 text-center text-sm">{t('songs.empty')}</p>
            ) : null}
            <p className="text-ink-3 mx-2 mt-4 text-xs">{t('editor.suggest.foot')}</p>
          </>
        )}
      </div>
    </div>
  );
}
