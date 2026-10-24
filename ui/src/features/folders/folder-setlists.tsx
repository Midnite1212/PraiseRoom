import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bulletlist, Close, Search } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EmptyState } from '@/components/page/empty-state';
import { GroupTitle } from '@/components/page/group-title';
import { LIST_CLASSES } from '@/components/page/list-row';
import { DateBlock } from '@/components/primitives/date-block';
import { PickRow } from '@/components/primitives/pick-row';
import { nextSetlistId, setStatus } from '@/components/primitives/set-status';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Session } from '@/features/auth/session';
import { type Folder, setlistsQueryOptions } from '@/features/setlists/api';
import { canEditSetlist } from '@/features/setlists/permissions';
import { SetlistRow } from '@/features/setlists/setlist-row';
import { useSetlistNames } from '@/features/setlists/use-setlist-names';

import { FOLDER_RELATED_QUERY_KEYS, setFolderSetlists } from './api';
import { orderFolderSetlists } from './order-setlists';

const useFolderSetlistsUpdate = (folder: Folder) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setlistIds: string[]) => setFolderSetlists(folder._id, setlistIds),
    onSuccess: () =>
      Promise.all(
        FOLDER_RELATED_QUERY_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: [...queryKey] })
        )
      ),
    onError: () => {
      toast.error(t('folders.setlistsFailed'));
    },
  });
};

type FolderSetlistsProps = {
  session: Session;
  folder: Folder;
  canEdit: boolean;
  now: number;
};

export function FolderSetlists({ session, folder, canEdit, now }: FolderSetlistsProps) {
  const { t } = useTranslation();
  const { data: setlists, isPending } = useQuery(setlistsQueryOptions());
  const names = useSetlistNames(session);
  const update = useFolderSetlistsUpdate(folder);
  const nextId = nextSetlistId(setlists ?? [], now);
  const inFolder = new Set(folder.setlistIds);
  const folderSetlists = orderFolderSetlists(
    (setlists ?? []).filter(({ _id }) => inFolder.has(_id)),
    now
  );

  return (
    <section aria-labelledby="folder-setlists">
      <GroupTitle
        id="folder-setlists"
        title={t('setlists.title')}
        count={folder.setlistIds.length}
        className={canEdit ? 'mt-0' : 'mt-6'}
      />
      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : folderSetlists.length === 0 ? (
        <EmptyState title={t('folders.noSetlists')}>{t('folders.noSetlistsHint')}</EmptyState>
      ) : (
        <ul className={LIST_CLASSES}>
          {folderSetlists.map((setlist) => (
            <li key={setlist._id}>
              <SetlistRow
                session={session}
                setlist={setlist}
                names={names}
                status={setStatus(setlist, nextId, now)}
                hideFolderId={folder._id}
                actions={
                  canEdit ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={update.isPending}
                      aria-label={t('folders.removeSetlist', { name: setlist.name })}
                      title={t('folders.removeFromFolder')}
                      onClick={() =>
                        update.mutate(
                          folder.setlistIds.filter((id) => id !== setlist._id),
                          {
                            onSuccess: () =>
                              toast.success(t('folders.setlistRemoved', { name: setlist.name })),
                          }
                        )
                      }
                    >
                      <Close />
                    </Button>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Pick setlists to add; only ones you can edit, as the server allows.
export function AddSetlistsDialog({
  session,
  folder,
  now,
  open,
  onOpenChange,
}: {
  session: Session;
  folder: Folder;
  now: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: setlists } = useQuery(setlistsQueryOptions());
  const update = useFolderSetlistsUpdate(folder);
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<readonly string[]>([]);
  const nextId = nextSetlistId(setlists ?? [], now);
  const inFolder = new Set(folder.setlistIds);
  const query = search.trim().toLocaleLowerCase();
  const options = (setlists ?? []).filter(
    (setlist) =>
      canEditSetlist(session, setlist) &&
      (!query || setlist.name.toLocaleLowerCase().includes(query))
  );

  const reset = () => {
    setSearch('');
    setPicked([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="[--dw:520px]"
        footer={
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t('editor.cancel')}</Button>
            </DialogClose>
            <Button
              disabled={picked.length === 0 || update.isPending}
              onClick={() =>
                update.mutate([...folder.setlistIds, ...picked], {
                  onSuccess: () => {
                    toast.success(t('folders.setlistsAdded', { count: picked.length }));
                    reset();
                    onOpenChange(false);
                  },
                })
              }
            >
              {picked.length > 0
                ? t('folders.addCount', { count: picked.length })
                : t('editor.add')}
            </Button>
          </DialogFooter>
        }
      >
        <DialogHeader icon={<Bulletlist />}>
          <DialogTitle>{t('folders.addSetlists')}</DialogTitle>
          <DialogDescription>
            {t('folders.addSetlistsDescription', { name: folder.groupName })}
          </DialogDescription>
        </DialogHeader>
        <label className="bg-fill-hover [&_svg]:size-icon [&_svg]:text-ink-2 flex h-12 flex-none items-center gap-2.5 rounded-2xl px-3.5">
          <Search />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('folders.searchSetlists')}
            aria-label={t('folders.searchSetlists')}
            autoComplete="off"
            className="placeholder:text-ink-3 h-full min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
        <div className="-mx-1 flex flex-col">
          {options.length === 0 ? (
            <p className="text-ink-2 py-4 text-center text-sm">{t('folders.noSetlistsToAdd')}</p>
          ) : (
            options.map((setlist) => {
              const isIn = inFolder.has(setlist._id);
              return (
                <PickRow
                  key={setlist._id}
                  leading={
                    <DateBlock
                      date={setlist.date}
                      status={setStatus(setlist, nextId, now)}
                      size="sm"
                    />
                  }
                  title={setlist.name}
                  hint={
                    isIn
                      ? t('folders.alreadyIn')
                      : t('reader.songCount', { count: setlist.songs.length })
                  }
                  checked={isIn || picked.includes(setlist._id)}
                  disabled={isIn}
                  onToggle={() =>
                    setPicked((current) =>
                      current.includes(setlist._id)
                        ? current.filter((id) => id !== setlist._id)
                        : [...current, setlist._id]
                    )
                  }
                />
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
