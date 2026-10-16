import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { LanguageSwitch } from '@/components/layout/language-switch';
import { ThemeToggle } from '@/components/layout/theme-toggle';
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
  pendingComponent: () => <Skeleton className="m-4 h-[80svh]" />,
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
    <div className="min-h-svh">
      <header className="flex items-center gap-2 px-4 py-3 md:px-6">
        <span className="font-heading min-w-0 flex-1 truncate font-semibold">{t('app.name')}</span>
        {session ? (
          <Button asChild variant="outline" size="sm">
            <Link to="/setlists/$setlistId" params={{ setlistId }} search={{ song }}>
              {t('reader.openInApp')}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link to="/login" search={{ redirect: `/setlist/view/${setlistId}` }}>
              {t('login.submit')}
            </Link>
          </Button>
        )}
        <LanguageSwitch />
        <ThemeToggle />
      </header>
      <main className="px-4 pb-6 md:px-6">
        <MusicianView
          key={setlist._id}
          setlist={setlist}
          songNumber={song}
          variant="public"
          onSongChange={(number) => void navigate({ search: { song: number }, replace: true })}
        />
      </main>
    </div>
  );
}
