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

import { publicSetlistUrl, type SetlistSummary } from './api';
import { canDeleteSetlist, canEditSetlist } from './permissions';
import { useDeleteSetlist } from './use-delete-setlist';

// What you may do with a setlist from a list (edit, copy its public link, delete) and the delete
// confirmation, shared by the wide ⋯ menu and the phone swipe actions.
export const useSetlistActions = (session: Session, setlist: SetlistSummary) => {
  const { t } = useTranslation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const remove = useDeleteSetlist();

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

  return {
    canEdit: canEditSetlist(session, setlist),
    canDelete: canDeleteSetlist(session, setlist),
    canShare: Boolean(setlist.publicLink),
    copyLink: () => void copyLink(),
    requestDelete: () => setIsConfirmOpen(true),
    confirmDelete,
  };
};
