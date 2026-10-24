import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
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
import { Button } from '@/components/ui/button';
import { clearAuthToken } from '@/lib/api-client';

import { deleteAccount } from './api';
import type { AccountCounts } from './counts';

// Removes the setlists and folders you made (songs stay), then the sign-in itself.
export function DeleteAccount({ counts }: { counts: AccountCounts | undefined }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const remove = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      clearAuthToken();
      queryClient.clear();
      setOpen(false);
      toast.success(t('account.delete.done'));
      await navigate({ to: '/sign-up' });
    },
    onError: () => toast.error(t('account.delete.failed')),
  });

  const description = counts
    ? t('account.delete.description', {
        setlists: t('account.count.setlists', { count: counts.setlistsMade }),
        folders: t('account.count.folders', { count: counts.foldersMade }),
      })
    : t('account.delete.descriptionGeneric');

  return (
    <section
      aria-labelledby="account-delete"
      className="border-hairline flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t pt-6"
    >
      <div className="max-w-[44ch] min-w-0">
        <h3 id="account-delete" className="m-0 text-base font-bold">
          {t('account.delete.title')}
        </h3>
        <p className="text-ink-3 mt-1 text-[0.8125rem] leading-[1.45]">{description}</p>
      </div>
      <Button variant="exit" className="h-10 px-4" onClick={() => setOpen(true)}>
        <Trash />
        {t('account.delete.action')}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader icon={<Trash />}>
            <AlertDialogTitle>{t('account.delete.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('account.delete.confirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>{t('editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive-solid"
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                remove.mutate();
              }}
            >
              {t('account.delete.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
