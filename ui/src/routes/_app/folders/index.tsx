import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight, Folder as FolderIcon } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { membersOf, peopleQueryOptions } from '@/features/folders/api';
import { CreateFolderDialog } from '@/features/folders/create-folder-dialog';
import { foldersQueryOptions } from '@/features/setlists/api';
import { ownFolders } from '@/features/setlists/permissions';

export const Route = createFileRoute('/_app/folders/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(foldersQueryOptions()),
  pendingComponent: () => <Skeleton className="mx-auto h-64 max-w-3xl" />,
  component: FoldersPage,
});

function FoldersPage() {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const { data: folders } = useSuspenseQuery(foldersQueryOptions());
  const { data: people } = useQuery(peopleQueryOptions());
  const mine = ownFolders(session, folders).toSorted((a, b) =>
    a.groupName.localeCompare(b.groupName)
  );

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t('folders.title')}</h1>
        <CreateFolderDialog session={session} />
      </div>
      {mine.length === 0 ? (
        <p className="bg-sheet text-muted-foreground rounded-xl border p-8 text-center">
          {t('folders.empty')}
        </p>
      ) : (
        <ul className="bg-sheet divide-y overflow-hidden rounded-xl border">
          {mine.map((folder) => (
            <li key={folder._id}>
              <Link
                to="/folders/$folderId"
                params={{ folderId: folder._id }}
                className="hover:bg-accent/60 flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <FolderIcon className="text-label size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{folder.groupName}</p>
                  <p className="text-muted-foreground text-xs">
                    {t('folders.setlists', { count: folder.setlistIds.length })}
                    {people
                      ? ` · ${t('folders.members', { count: membersOf(people, folder._id).length })}`
                      : null}
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
