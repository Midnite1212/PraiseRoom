import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Session } from '@/features/auth/session';

import { duplicateSetlist, publicSetlistUrl, type SetlistSummary } from './api';
import { canDeleteSetlist, canEditSetlist } from './permissions';
import { SetlistFolderDialog } from './setlist-folder-dialog';
import { useDeleteSetlist } from './use-delete-setlist';

// What you may do with a setlist from a list (edit, copy its public link, duplicate, file it in a
// folder, delete) and its delete confirmation and folder picker, shared by the ⋯ menu and the phone
// swipe actions.
export const useSetlistActions = (session: Session, setlist: SetlistSummary) => {
  const { t } = useTranslation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isFoldersOpen, setIsFoldersOpen] = useState(false);
  const remove = useDeleteSetlist();
  const queryClient = useQueryClient();
  const duplicate = useMutation({
    mutationFn: () =>
      duplicateSetlist(setlist._id, t('setlists.menu.copyName', { name: setlist.name })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success(t('setlists.menu.duplicated', { name: setlist.name }));
    },
    onError: () => {
      toast.error(t('setlists.menu.duplicateFailed'));
    },
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicSetlistUrl(setlist._id));
      toast.success(t('reader.linkCopied'));
    } catch {
      toast.error(t('reader.linkCopyFailed'));
    }
  };

  const confirmDelete = (
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader icon={<Trash />}>
          <AlertDialogTitle>{t('editor.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('editor.deleteDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive-solid"
            disabled={remove.isPending}
            onClick={() => remove.mutate(setlist._id)}
          >
            {t('editor.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const folderDialog = (
    <SetlistFolderDialog
      session={session}
      setlist={setlist}
      open={isFoldersOpen}
      onOpenChange={setIsFoldersOpen}
    />
  );

  return {
    canEdit: canEditSetlist(session, setlist),
    canDelete: canDeleteSetlist(session, setlist),
    canShare: Boolean(setlist.publicLink),
    copyLink: () => void copyLink(),
    requestDelete: () => setIsConfirmOpen(true),
    duplicate: () => duplicate.mutate(),
    isDuplicating: duplicate.isPending,
    requestFolders: () => setIsFoldersOpen(true),
    confirmDelete,
    folderDialog,
  };
};
