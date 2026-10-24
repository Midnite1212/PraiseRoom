import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Close, FolderPlus } from 'pixelarticons/react';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { EmptyState } from '@/components/page/empty-state';
import { Finder } from '@/components/page/finder';
import { LIST_CLASSES } from '@/components/page/list-row';
import { PageHeader } from '@/components/page/page-header';
import { Fab } from '@/components/primitives/fab';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { peopleQueryOptions } from '@/features/folders/api';
import { CreateFolderDialog } from '@/features/folders/create-folder-dialog';
import { FolderDetail } from '@/features/folders/folder-detail';
import { FolderRow } from '@/features/folders/folder-row';
import { foldersQueryOptions, setlistsQueryOptions } from '@/features/setlists/api';
import { ownFolders } from '@/features/setlists/permissions';
import { useIsRoomy, useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app/folders/')({
  validateSearch: z.object({ folder: z.string().optional().catch(undefined) }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(foldersQueryOptions()),
      context.queryClient.ensureQueryData(setlistsQueryOptions()),
    ]);
    return { now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: FoldersPage,
});

const isEditable = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest(
    'input, textarea, select, [contenteditable], [role="dialog"], [role="alertdialog"], [role="menu"]'
  ) !== null;

function FoldersPage() {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const { now } = Route.useLoaderData();
  const { folder: chosenId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const isWide = useIsWide();
  const isRoomy = useIsRoomy();
  const { data: folders } = useSuspenseQuery(foldersQueryOptions());
  const { data: people } = useQuery(peopleQueryOptions());
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const own = ownFolders(session, folders);
  const query = search.trim().toLocaleLowerCase();
  const mine = own
    .filter((folder) => !query || folder.groupName.toLocaleLowerCase().includes(query))
    .toSorted((a, b) => a.groupName.localeCompare(b.groupName));
  const chosen = isRoomy ? own.find((folder) => folder._id === chosenId) : undefined;
  const paneId = chosen?._id;
  const newLabel = t('folders.new');

  const closePane = () => {
    void navigate({ search: {} }).then(() => {
      document.querySelector<HTMLElement>(`[data-folder-row="${chosenId}"]`)?.focus();
    });
  };

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || isEditable(event.target)) return;
      void navigate({ search: {} }).then(() => {
        document.querySelector<HTMLElement>(`[data-folder-row="${paneId}"]`)?.focus();
      });
    };
    if (paneId) window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [paneId, navigate]);

  return (
    <>
      <PageHeader
        title={t('folders.title')}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <FolderPlus />
            {newLabel}
          </Button>
        }
      />
      <div
        className={cn(
          'roomy:grid roomy:items-start roomy:gap-10',
          chosen ? 'roomy:grid-cols-2' : 'roomy:grid-cols-1'
        )}
      >
        <div className={cn(chosen && 'roomy:sticky roomy:top-3.5')}>
          <Finder
            value={search}
            onChange={setSearch}
            placeholder={t('folders.searchPlaceholder')}
            label={t('folders.searchLabel')}
            sticky={!isWide}
          />
          {mine.length === 0 ? (
            <EmptyState title={query ? t('folders.noMatches') : t('folders.emptyTitle')}>
              {query ? t('folders.noMatchesHint') : t('folders.empty')}
            </EmptyState>
          ) : (
            <ul className={cn(LIST_CLASSES, 'mt-2')}>
              {mine.map((folder) => (
                <li key={folder._id}>
                  <FolderRow
                    session={session}
                    folder={folder}
                    people={people}
                    now={now}
                    pane={
                      isRoomy
                        ? { selected: folder._id === chosen?._id, isOpen: !!chosen }
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        {chosen ? (
          <div className="border-hairline animate-pane-in relative min-w-0 border-l pl-10">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-1 -right-2 z-10"
              aria-label={t('folders.closePreview')}
              title={t('folders.closePreview')}
              onClick={closePane}
            >
              <Close />
            </Button>
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <FolderDetail
                key={chosen._id}
                folderId={chosen._id}
                session={session}
                now={now}
                inPane
              />
            </Suspense>
          </div>
        ) : null}
      </div>
      <Fab aria-label={newLabel} title={newLabel} onClick={() => setIsCreateOpen(true)}>
        <FolderPlus />
      </Fab>
      <CreateFolderDialog session={session} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  );
}
