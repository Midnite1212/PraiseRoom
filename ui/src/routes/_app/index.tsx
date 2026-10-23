import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { GroupTitle } from '@/components/page/group-title';
import { LIST_CLASSES } from '@/components/page/list-row';
import { PageHeader } from '@/components/page/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { peopleQueryOptions } from '@/features/folders/api';
import { FolderRow } from '@/features/folders/folder-card';
import { NextUp } from '@/features/home/next-up';
import { foldersQueryOptions, setlistsQueryOptions } from '@/features/setlists/api';
import { groupSetlists } from '@/features/setlists/list';
import { ownFolders } from '@/features/setlists/permissions';
import { SetlistRow } from '@/features/setlists/setlist-row';
import { useSetlistNames } from '@/features/setlists/use-setlist-names';
import { songSearchQueryOptions } from '@/features/songs/api';

export const Route = createFileRoute('/_app/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(setlistsQueryOptions());
    return { now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="h-96 w-full" />,
  component: HomePage,
});

function AllLink({ to, label }: { to: '/setlists' | '/folders' | '/songs'; label: string }) {
  return (
    <Button asChild variant="link" size="sm">
      <Link to={to}>
        {label}
        <ChevronRight />
      </Link>
    </Button>
  );
}

// What's next, then a way into everything else.
function HomePage() {
  const { t, i18n } = useTranslation();
  const { session } = Route.useRouteContext();
  const { now } = Route.useLoaderData();
  const { data: setlists } = useSuspenseQuery(setlistsQueryOptions());
  const { data: folders } = useQuery(foldersQueryOptions());
  const { data: people } = useQuery(peopleQueryOptions());
  const { data: library } = useQuery(songSearchQueryOptions({ keyword: '', page: 1 }));
  const names = useSetlistNames(session);

  const upcoming = groupSetlists(setlists, new Date(now)).upcoming;
  const [next, ...later] = upcoming;
  const myFolders = ownFolders(session, folders ?? []).toSorted((a, b) =>
    a.groupName.localeCompare(b.groupName)
  );

  return (
    <>
      <PageHeader
        title={t('home.welcome', { name: session.fullName })}
        description={new Intl.DateTimeFormat(i18n.language, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(new Date(now))}
      />
      <div className="wide:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] wide:items-start grid gap-x-10 gap-y-2">
        <div className="min-w-0">
          {next ? (
            <NextUp session={session} setlist={next} names={names} now={now} />
          ) : (
            <EmptyState title={t('home.nothingNext')}>{t('home.nothingNextHint')}</EmptyState>
          )}
          {later.length > 0 ? (
            <>
              <GroupTitle
                title={t('home.comingUp')}
                count={later.length}
                action={<AllLink to="/setlists" label={t('home.allSetlists')} />}
              />
              <ul className={LIST_CLASSES}>
                {later.map((setlist) => (
                  <li key={setlist._id}>
                    <SetlistRow session={session} setlist={setlist} names={names} status="up" />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <div className="min-w-0">
          <GroupTitle
            title={t('home.yourFolders')}
            count={myFolders.length}
            action={<AllLink to="/folders" label={t('home.all')} />}
            first
            className="wide:mt-0"
          />
          {myFolders.length === 0 ? (
            <EmptyState title={t('folders.emptyTitle')}>{t('folders.empty')}</EmptyState>
          ) : (
            <ul className={LIST_CLASSES}>
              {myFolders.map((folder) => (
                <li key={folder._id}>
                  <FolderRow session={session} folder={folder} people={people} />
                </li>
              ))}
            </ul>
          )}
          <GroupTitle
            title={t('home.library')}
            count={library?.totalCount}
            action={<AllLink to="/songs" label={t('home.allSongs')} />}
          />
        </div>
      </div>
    </>
  );
}
