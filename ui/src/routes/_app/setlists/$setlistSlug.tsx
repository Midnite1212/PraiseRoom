import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { PenSquare } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReaderBack } from '@/features/reader/reader-back';
import { setlistQueryOptions, setlistSlug } from '@/features/setlists/api';
import { MusicianView } from '@/features/setlists/musician-view/musician-view';
import { canEditSetlist } from '@/features/setlists/permissions';
import { ensureFromSlug } from '@/lib/ensure-or-not-found';

const musicianSearchSchema = z.object({
  song: z.number().int().min(1).default(1).catch(1),
});

export const Route = createFileRoute('/_app/setlists/$setlistSlug')({
  staticData: { chrome: 'reader' },
  validateSearch: musicianSearchSchema,
  loader: async ({ context, params }) => {
    const { urlKey } = await ensureFromSlug(
      context.queryClient,
      params.setlistSlug,
      setlistQueryOptions
    );
    return { urlKey };
  },
  pendingComponent: MusicianPending,
  component: MusicianPage,
});

function MusicianPage() {
  const { t } = useTranslation();
  const { urlKey } = Route.useLoaderData();
  const { song } = Route.useSearch();
  const { session } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const { data: setlist } = useSuspenseQuery(setlistQueryOptions(urlKey));

  return (
    <MusicianView
      key={setlist._id}
      setlist={setlist}
      songNumber={song}
      onSongChange={(number) => void navigate({ search: { song: number }, replace: true })}
      back={<ReaderBack to="/setlists" label={t('setlists.title')} />}
      actions={
        canEditSetlist(session, setlist) ? (
          <Button asChild variant="glass" size="icon-lg" aria-label={t('editor.edit')}>
            <Link
              to="/setlists/$setlistSlug/edit"
              params={{ setlistSlug: setlistSlug(setlist) }}
              title={t('editor.edit')}
            >
              <PenSquare />
            </Link>
          </Button>
        ) : null
      }
    />
  );
}

function MusicianPending() {
  return (
    <div className="mx-auto mt-24 flex max-w-6xl gap-4 px-4">
      <Skeleton className="wide:block hidden h-[70svh] w-72" />
      <Skeleton className="h-[70svh] flex-1" />
    </div>
  );
}
