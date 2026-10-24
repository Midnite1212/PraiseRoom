import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { goneToast } from '@/components/primitives/gone-toast';

import { deleteSetlist } from './api';

// Deletes, drops the cached setlist, refreshes lists, and toasts both outcomes.
export const useDeleteSetlist = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSetlist,
    onSuccess: async (_, setlistId) => {
      queryClient.removeQueries({ queryKey: ['setlists', 'detail', setlistId] });
      await queryClient.invalidateQueries({ queryKey: ['setlists'] });
      goneToast(t('editor.deleted'));
    },
    onError: () => {
      toast.error(t('editor.deleteFailed'));
    },
  });
};
