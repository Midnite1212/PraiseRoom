import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { signOut } from './session';

export const useSignOut = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    try {
      await signOut();
    } catch {
      toast.error(t('user.signOutFailed'));
      return;
    }
    queryClient.clear();
    await navigate({ to: '/login' });
  };
};
