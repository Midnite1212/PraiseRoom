import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
      toast.success(t('editor.deleted'));
    },
    onError: () => {
      toast.error(t('editor.deleteFailed'));
    },
  });
};
