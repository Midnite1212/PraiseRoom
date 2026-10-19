import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { canWriteSongs } from '@/features/auth/session';
import { SongImportFlow } from '@/features/song-import/song-import-flow';
import { songSearchQueryOptions } from '@/features/songs/api';
import { SongFilters } from '@/features/songs/song-filters';
import { SongSearchForm } from '@/features/songs/song-search-form';
import { SongsTable } from '@/features/songs/songs-table';

const songsSearchSchema = z.object({
  q: z.string().default('').catch(''),
  page: z.number().int().min(1).default(1).catch(1),
  tempo: z.array(z.string()).default([]).catch([]),
  themes: z.array(z.string()).default([]).catch([]),
  web: z.boolean().default(false).catch(false),
});

export const Route = createFileRoute('/_app/songs/')({
  validateSearch: songsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      songSearchQueryOptions({
        keyword: deps.q,
        page: deps.page,
        tempo: deps.tempo,
        themes: deps.themes,
      })
    ),
  pendingComponent: SongsPending,
  component: SongsPage,
});

function SongsPage() {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const search = Route.useSearch();
  const { q, page, tempo, themes, web } = search;
  const navigate = Route.useNavigate();
  const { data, isError, isFetching } = useQuery({
    ...songSearchQueryOptions({ keyword: q, page, tempo, themes }),
    placeholderData: keepPreviousData,
  });

  const canSearchWeb = canWriteSongs(session);
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const goToPage = (nextPage: number) => void navigate({ search: { ...search, page: nextPage } });

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">{t('songs.title')}</h1>
      <div className="flex flex-wrap items-end gap-2">
        <SongSearchForm
          key={q}
          keyword={q}
          onSearch={(keyword) => void navigate({ search: { ...search, q: keyword, page: 1 } })}
          canSearchWeb={canSearchWeb}
          web={web}
          onWebChange={(value) => void navigate({ search: { ...search, web: value } })}
        />
        <SongFilters
          tempo={tempo}
          themes={themes}
          onChange={(filters) => void navigate({ search: { ...search, ...filters, page: 1 } })}
        />
      </div>
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
      {canSearchWeb && web && q.trim() !== '' ? <SongImportFlow key={q} q={q} /> : null}
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
