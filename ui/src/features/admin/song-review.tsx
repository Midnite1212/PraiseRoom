import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Check } from 'pixelarticons/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EmptyState } from '@/components/page/empty-state';
import { Finder } from '@/components/page/finder';
import { LIST_CLASSES, listRowClasses, RowText } from '@/components/page/list-row';
import { LoadingStatus } from '@/components/page/loading-status';
import { Tag } from '@/components/primitives/tag';
import { Button } from '@/components/ui/button';
import { songSlug } from '@/features/songs/api';
import { MAX_KEYWORD_LENGTH, toSearchKeyword } from '@/features/songs/song-search';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useNearEnd } from '@/hooks/use-near-end';
import { ApiError } from '@/lib/api-client';

import { type ReviewSong, setSongVerified, songReviewInfiniteQueryOptions } from './api';

// Songs to check, unverified first, each with a verify or unverify action and a link to the song.
export function SongReview() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const keyword = toSearchKeyword(useDebouncedValue(text, 300));
  const { data, isPending, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      ...songReviewInfiniteQueryOptions(keyword),
      placeholderData: keepPreviousData,
    });
  const endRef = useRef<HTMLDivElement>(null);
  useNearEnd(endRef, {
    enabled: hasNextPage && !isFetching,
    onNear: () => void fetchNextPage(),
  });

  const verify = useMutation({
    mutationFn: setSongVerified,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['songs'] }),
    onError: (error) =>
      toast.error(
        t(
          error instanceof ApiError && error.status === 404
            ? 'admin.songs.notFound'
            : 'admin.songs.failed'
        )
      ),
  });
  const toggle = (song: ReviewSong) =>
    verify.mutate(
      { id: song._id, isVerified: !song.isVerified },
      {
        onSuccess: (_updated, { isVerified }) =>
          toast.success(
            t(isVerified ? 'admin.songs.markedVerified' : 'admin.songs.markedUnverified', {
              title: song.title,
            })
          ),
      }
    );

  const songs = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section>
      <Finder
        value={text}
        onChange={setText}
        placeholder={t('admin.songs.search')}
        label={t('admin.songs.search')}
        maxLength={MAX_KEYWORD_LENGTH}
        sticky={false}
      />
      {isPending ? (
        <LoadingStatus>{t('admin.songs.search')}</LoadingStatus>
      ) : isError ? (
        <EmptyState title={t('admin.songs.loadFailed')} />
      ) : songs.length === 0 ? (
        <EmptyState
          title={t('admin.songs.empty')}
          onClearSearch={text ? () => setText('') : undefined}
        />
      ) : (
        <ul className={LIST_CLASSES}>
          {songs.map((song) => {
            const isSaving = verify.isPending && verify.variables.id === song._id;
            return (
              <li key={song._id} className={listRowClasses('grid-cols-[minmax(0,1fr)_auto]')}>
                <Link
                  to="/songs/$songSlug"
                  params={{ songSlug: songSlug(song) }}
                  className="focus-visible:ring-ring min-w-0 rounded-xl outline-none focus-visible:ring-2"
                >
                  <RowText
                    title={song.title}
                    meta={
                      <>
                        <span className="truncate">{song.artist}</span>
                        {song.isVerified ? (
                          <Tag>
                            <Check />
                            {t('admin.songs.verified')}
                          </Tag>
                        ) : (
                          <Tag className="text-ink-3">{t('admin.songs.unverified')}</Tag>
                        )}
                      </>
                    }
                  />
                </Link>
                <Button
                  variant={song.isVerified ? 'ghost' : 'secondary'}
                  size="sm"
                  disabled={isSaving}
                  aria-label={t(
                    song.isVerified ? 'admin.songs.unverifyTitle' : 'admin.songs.verifyTitle',
                    { title: song.title }
                  )}
                  onClick={() => toggle(song)}
                >
                  {t(song.isVerified ? 'admin.songs.unverify' : 'admin.songs.verify')}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={endRef} />
      {isFetchingNextPage ? <LoadingStatus compact>{t('admin.songs.search')}</LoadingStatus> : null}
    </section>
  );
}
