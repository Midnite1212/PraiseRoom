import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Folder } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { RowTile } from '@/components/primitives/date-block';
import { PickRow } from '@/components/primitives/pick-row';
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
import type { Session } from '@/features/auth/session';

import { foldersQueryOptions, type SetlistSummary, setSetlistFolders } from './api';
import { ownFolders } from './permissions';

type SetlistFolderDialogProps = {
  session: Session;
  setlist: SetlistSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Pick the folders a setlist belongs to; everyone in a folder can open and edit it.
export function SetlistFolderDialog({
  session,
  setlist,
  open,
  onOpenChange,
}: SetlistFolderDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data } = useQuery(foldersQueryOptions());
  const folders = ownFolders(session, data ?? []);
  const [draft, setDraft] = useState<string[] | null>(null);
  const selected = draft ?? setlist.groupIds;
  const isChanged =
    draft !== null &&
    (draft.length !== setlist.groupIds.length ||
      draft.some((groupId) => !setlist.groupIds.includes(groupId)));

  const save = useMutation({
    mutationFn: () => setSetlistFolders(setlist._id, selected),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['setlists'] }),
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
      ]);
      toast.success(t('setlists.menu.foldersSaved'));
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t('setlists.menu.foldersFailed'));
    },
  });

  const toggle = (folderId: string) =>
    setDraft(
      selected.includes(folderId)
        ? selected.filter((groupId) => groupId !== folderId)
        : [...selected, folderId]
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setDraft(null);
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="[--dw:420px]"
        footer={
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t('editor.cancel')}</Button>
            </DialogClose>
            <Button disabled={!isChanged || save.isPending} onClick={() => save.mutate()}>
              {t('editor.save')}
            </Button>
          </DialogFooter>
        }
      >
        <DialogHeader icon={<Folder />}>
          <DialogTitle>{t('setlists.menu.addToFolder')}</DialogTitle>
          <DialogDescription>{t('setlists.menu.folderDescription')}</DialogDescription>
        </DialogHeader>
        <div className="-mx-1 flex flex-col">
          {folders.length === 0 ? (
            <p className="text-ink-2 py-4 text-center text-sm">{t('editor.noFolders')}</p>
          ) : (
            folders.map((folder) => (
              <PickRow
                key={folder._id}
                leading={
                  <RowTile size="sm">
                    <Folder />
                  </RowTile>
                }
                title={folder.groupName}
                hint={t('folders.setlists', { count: folder.setlistIds.length })}
                checked={selected.includes(folder._id)}
                onToggle={() => toggle(folder._id)}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
