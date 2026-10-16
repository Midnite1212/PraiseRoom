import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { setlistsQueryOptions } from '@/features/setlists/api';
import { formatSetlistDate } from '@/features/setlists/format-date';

export const Route = createFileRoute('/_app/setlists/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(setlistsQueryOptions()),
  pendingComponent: () => <Skeleton className="mx-auto h-64 max-w-3xl" />,
  component: SetlistsPage,
});

function SetlistsPage() {
  const { t, i18n } = useTranslation();
  const { data: setlists } = useSuspenseQuery(setlistsQueryOptions());

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t('setlists.title')}</h1>
      {setlists.length === 0 ? (
        <p className="bg-sheet text-muted-foreground rounded-xl border p-8 text-center">
          {t('setlists.empty')}
        </p>
      ) : (
        <ul className="bg-sheet divide-y overflow-hidden rounded-xl border">
          {setlists.map((setlist) => (
            <li key={setlist._id}>
              <Link
                to="/setlists/$setlistId"
                params={{ setlistId: setlist._id }}
                className="hover:bg-accent/60 flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{setlist.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {formatSetlistDate(setlist.date, i18n.language) ?? t('setlists.noDate')}
                    {' · '}
                    {t('reader.songCount', { count: setlist.songs.length })}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground size-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
