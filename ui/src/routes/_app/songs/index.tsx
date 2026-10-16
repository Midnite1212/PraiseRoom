import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { songSearchQueryOptions } from '@/features/songs/api';
import { SongSearchForm } from '@/features/songs/song-search-form';
import { SongsTable } from '@/features/songs/songs-table';

const songsSearchSchema = z.object({
  q: z.string().default('').catch(''),
  page: z.number().int().min(1).default(1).catch(1),
});

export const Route = createFileRoute('/_app/songs/')({
  validateSearch: songsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      songSearchQueryOptions({ keyword: deps.q, page: deps.page })
    ),
  pendingComponent: SongsPending,
  component: SongsPage,
});

function SongsPage() {
  const { t } = useTranslation();
  const { q, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isError, isFetching } = useQuery({
    ...songSearchQueryOptions({ keyword: q, page }),
    placeholderData: keepPreviousData,
  });

  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const goToPage = (nextPage: number) => void navigate({ search: { q, page: nextPage } });

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">{t('songs.title')}</h1>
      <SongSearchForm
        key={q}
        keyword={q}
        onSearch={(keyword) => void navigate({ search: { q: keyword, page: 1 } })}
      />
      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>{t('songs.loadFailed')}</AlertDescription>
        </Alert>
      ) : (
        <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
          <SongsTable songs={data?.data ?? []} />
        </div>
      )}
      <nav className="flex items-center justify-between gap-2" aria-label={t('songs.title')}>
        <Button variant="outline" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
          {t('songs.previous')}
        </Button>
        <span className="text-muted-foreground text-sm">
          {t('songs.page', { page, total: totalPages })}
        </span>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
          {t('songs.next')}
        </Button>
      </nav>
    </section>
  );
}

function SongsPending() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-full max-w-sm" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
