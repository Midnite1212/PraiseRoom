import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { sessionQueryOptions } from '@/features/auth/session';
import { setlistQueryOptions } from '@/features/setlists/api';
import { MusicianView } from '@/features/setlists/musician-view/musician-view';
import { ensureOrNotFound } from '@/lib/ensure-or-not-found';

const publicSearchSchema = z.object({
  song: z.number().int().min(1).default(1).catch(1),
});

// The path matches the `publicLink` the server stores on every setlist, so shared links keep working.
export const Route = createFileRoute('/setlist/view/$setlistId')({
  validateSearch: publicSearchSchema,
  loader: ({ context, params }) =>
    ensureOrNotFound(context.queryClient, setlistQueryOptions(params.setlistId)),
  pendingComponent: () => <Skeleton className="mx-auto mt-24 h-[70svh] max-w-6xl" />,
  component: PublicSetlistPage,
});

function PublicSetlistPage() {
  const { t } = useTranslation();
  const { setlistId } = Route.useParams();
  const { song } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: setlist } = useSuspenseQuery(setlistQueryOptions(setlistId));
  const { data: session } = useQuery(sessionQueryOptions);

  return (
    <MusicianView
      key={setlist._id}
      setlist={setlist}
      songNumber={song}
      onSongChange={(number) => void navigate({ search: { song: number }, replace: true })}
      actions={
        <Button asChild variant="glass" className="h-12 px-4 text-sm">
          {session ? (
            <Link to="/setlists/$setlistId" params={{ setlistId }} search={{ song }}>
              {t('reader.openInApp')}
            </Link>
          ) : (
            <Link to="/login" search={{ redirect: `/setlist/view/${setlistId}` }}>
              {t('login.submit')}
            </Link>
          )}
        </Button>
      }
    />
  );
}
