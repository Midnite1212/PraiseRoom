import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { FolderPlus } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { Finder } from '@/components/page/finder';
import { LIST_CLASSES } from '@/components/page/list-row';
import { PageHeader } from '@/components/page/page-header';
import { Fab } from '@/components/primitives/fab';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { peopleQueryOptions } from '@/features/folders/api';
import { CreateFolderDialog } from '@/features/folders/create-folder-dialog';
import { FolderCard, FolderRow } from '@/features/folders/folder-card';
import { foldersQueryOptions } from '@/features/setlists/api';
import { ownFolders } from '@/features/setlists/permissions';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app/folders/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(foldersQueryOptions()),
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: FoldersPage,
});

function FoldersPage() {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const isWide = useIsWide();
  const { data: folders } = useSuspenseQuery(foldersQueryOptions());
  const { data: people } = useQuery(peopleQueryOptions());
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const query = search.trim().toLocaleLowerCase();
  const mine = ownFolders(session, folders)
    .filter((folder) => !query || folder.groupName.toLocaleLowerCase().includes(query))
    .toSorted((a, b) => a.groupName.localeCompare(b.groupName));
  const newLabel = t('folders.new');

  return (
    <>
      <PageHeader
        title={t('folders.title')}
        description={t('folders.intro')}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <FolderPlus />
            {newLabel}
          </Button>
        }
      />
      <Finder
        value={search}
        onChange={setSearch}
        placeholder={t('folders.searchPlaceholder')}
        label={t('folders.searchLabel')}
      />
      {mine.length === 0 ? (
        <EmptyState title={query ? t('folders.noMatches') : t('folders.emptyTitle')}>
          {query ? t('folders.noMatchesHint') : t('folders.empty')}
        </EmptyState>
      ) : isWide ? (
        <ul className="mt-[18px] grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-6 gap-y-8 p-0">
          {mine.map((folder) => (
            <li key={folder._id}>
              <FolderCard session={session} folder={folder} people={people} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={cn(LIST_CLASSES, 'mt-2')}>
          {mine.map((folder) => (
            <li key={folder._id}>
              <FolderRow session={session} folder={folder} people={people} />
            </li>
          ))}
        </ul>
      )}
      <Fab aria-label={newLabel} title={newLabel} onClick={() => setIsCreateOpen(true)}>
        <FolderPlus />
      </Fab>
      <CreateFolderDialog session={session} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  );
}
