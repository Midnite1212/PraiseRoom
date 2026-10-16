import { Link } from '@tanstack/react-router';
import { Eye, Link2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Session } from '@/features/auth/session';

import type { SetlistSummary } from './api';
import { canDeleteSetlist, canEditSetlist } from './permissions';
import { useDeleteSetlist } from './use-delete-setlist';

export function SetlistActions({
  session,
  setlist,
}: {
  session: Session;
  setlist: SetlistSummary;
}) {
  const { t } = useTranslation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const remove = useDeleteSetlist();
  const canEdit = canEditSetlist(session, setlist);
  const canDelete = canDeleteSetlist(session, setlist);
  const { publicLink } = setlist;

  const copyLink = async () => {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      toast.success(t('reader.linkCopied'));
    } catch {
      toast.error(t('reader.linkCopyFailed'));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('setlists.actions', { name: setlist.name })}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/setlists/$setlistId" params={{ setlistId: setlist._id }}>
              <Eye />
              {t('setlists.open')}
            </Link>
          </DropdownMenuItem>
          {canEdit ? (
            <DropdownMenuItem asChild>
              <Link to="/setlists/$setlistId/edit" params={{ setlistId: setlist._id }}>
                <Pencil />
                {t('editor.edit')}
              </Link>
            </DropdownMenuItem>
          ) : null}
          {publicLink ? (
            <DropdownMenuItem onSelect={() => void copyLink()}>
              <Link2 />
              {t('reader.copyLink')}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setIsConfirmOpen(true)}>
                <Trash2 />
                {t('editor.delete')}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('editor.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('editor.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate(setlist._id)}
            >
              {t('editor.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
