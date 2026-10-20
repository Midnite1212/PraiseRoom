import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, Plus, Search } from 'pixelarticons/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { type SongSummary, songSearchInfiniteQueryOptions } from '@/features/songs/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

type SongPickerProps = {
  selectedIds: ReadonlySet<string>;
  onToggle: (song: SongSummary) => void;
};

export function SongPicker({ selectedIds, onToggle }: SongPickerProps) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery(songSearchInfiniteQueryOptions(debouncedKeyword));
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const songs = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={t('songs.searchPlaceholder')}
          aria-label={t('songs.searchLabel')}
          className="pl-8"
        />
      </div>
      {isError ? <p className="text-destructive text-sm">{t('songs.loadFailed')}</p> : null}
      <ul className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2" aria-busy={isPending}>
        {isPending
          ? Array.from({ length: 6 }, (_, index) => (
              <li key={index} className="py-1.5">
                <Skeleton className="h-11 w-full" />
              </li>
            ))
          : null}
        {!isPending && songs.length === 0 ? (
          <li className="text-muted-foreground py-6 text-center text-sm">{t('songs.empty')}</li>
        ) : null}
        {songs.map((song) => {
          const isSelected = selectedIds.has(song._id);
          return (
            <li key={song._id} className="flex items-center gap-3 border-b py-2 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{song.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {song.artist}
                  <span className="font-mono"> · {song.originalKey}</span>
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isSelected ? 'secondary' : 'outline'}
                aria-pressed={isSelected}
                aria-label={t(isSelected ? 'editor.removeSong' : 'editor.addSong', {
                  title: song.title,
                })}
                onClick={() => onToggle(song)}
              >
                {isSelected ? <Check /> : <Plus />}
                {t(isSelected ? 'editor.added' : 'editor.add')}
              </Button>
            </li>
          );
        })}
        {hasNextPage ? (
          <li ref={sentinelRef} className="py-2">
            <Skeleton className="h-11 w-full" />
          </li>
        ) : null}
      </ul>
    </div>
  );
}
