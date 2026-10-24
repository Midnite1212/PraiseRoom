import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { KeyIcon } from '@/components/primitives/pixel-icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toAuthErrorKey } from '@/features/auth/errors';
import { GoogleMark } from '@/features/auth/google-sign-in';
import type { Session } from '@/features/auth/session';
import { SettingsGroup } from '@/features/settings/settings-group';
import { authClient } from '@/lib/auth-client';
import { dateLocale } from '@/lib/date-locale';

import { AccountItem, QUIET_DANGER_CLASSES } from './account-item';
import { ACCOUNT_QUERY_KEY, accountLoginsQueryOptions } from './api';

// Password and Google, the two ways to sign in. Google can only be disconnected while a password remains.
export function SignInMethods({ session }: { session: Session }) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const logins = useQuery(accountLoginsQueryOptions);
  const password = logins.data?.find(({ providerId }) => providerId === 'credential');
  const google = logins.data?.find(({ providerId }) => providerId === 'google');

  const connect = useMutation({
    mutationFn: () => authClient.linkGoogle('/account'),
    onError: () => toast.error(t('account.methods.connectFailed')),
  });
  const disconnect = useMutation({
    mutationFn: () => {
      if (!google) throw new Error('Google is not connected');
      return authClient.unlinkAccount(google);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...ACCOUNT_QUERY_KEY, 'logins'] });
      toast.success(t('account.methods.googleDisconnected'));
    },
    onError: (error: unknown) =>
      toast.error(
        toAuthErrorKey(error) === 'auth.errors.lastLogin'
          ? t('auth.errors.lastLogin')
          : t('account.methods.disconnectFailed')
      ),
  });

  return (
    <SettingsGroup id="account-methods" title={t('account.methods.title')}>
      {logins.isPending ? (
        <Skeleton className="mt-1.5 h-[132px]" />
      ) : logins.isError ? (
        <p className="text-ink-3 py-3 text-[0.8125rem]">{t('account.loadFailed')}</p>
      ) : (
        <ul className="mt-1.5">
          <AccountItem
            icon={<KeyIcon />}
            title={t('account.methods.password')}
            subtitle={
              password
                ? t('account.methods.passwordChanged', {
                    date: new Intl.DateTimeFormat(dateLocale(i18n.language), {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(password.updatedAt)),
                  })
                : t('account.methods.passwordNotSet')
            }
            action={
              password ? (
                <Button asChild variant="secondary" size="sm">
                  <Link to="/account/password">{t('account.methods.change')}</Link>
                </Button>
              ) : null
            }
          />
          <AccountItem
            icon={<GoogleMark />}
            title="Google"
            subtitle={google ? session.email : t('account.methods.notConnected')}
            action={
              google ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={QUIET_DANGER_CLASSES}
                  disabled={!password || disconnect.isPending}
                  title={password ? undefined : t('auth.errors.lastLogin')}
                  onClick={() => disconnect.mutate()}
                >
                  {t('account.methods.disconnect')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={connect.isPending}
                  onClick={() => connect.mutate()}
                >
                  {t('account.methods.connect')}
                </Button>
              )
            }
          />
        </ul>
      )}
    </SettingsGroup>
  );
}
