import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Logout, Monitor } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PhoneIcon } from '@/components/primitives/pixel-icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsGroup } from '@/features/settings/settings-group';
import { type AuthSession, authClient } from '@/lib/auth-client';
import { dateLocale } from '@/lib/date-locale';

import { AccountItem, QUIET_DANGER_CLASSES } from './account-item';
import { ACCOUNT_QUERY_KEY, accountSessionsQueryOptions } from './api';
import { parseUserAgent } from './device';
import { formatRelative } from './relative-time';

// This device first, then the others by when they were last active.
export const orderSessions = (
  sessions: readonly AuthSession[],
  currentToken: string | null
): AuthSession[] =>
  sessions.toSorted((a, b) => {
    if (a.token === currentToken) return -1;
    if (b.token === currentToken) return 1;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });

export function SessionsSection() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const sessions = useQuery(accountSessionsQueryOptions);
  const [now] = useState(Date.now);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: [...ACCOUNT_QUERY_KEY, 'sessions'] });
  const revoke = useMutation({
    mutationFn: ({ token }: { token: string; device: string }) => authClient.revokeSession(token),
    onSuccess: async (_data, { device }) => {
      await refresh();
      toast.success(t('account.sessions.signedOutOf', { device }));
    },
    onError: () => toast.error(t('account.sessions.signOutFailed')),
  });
  const revokeOthers = useMutation({
    mutationFn: () => authClient.revokeOtherSessions(),
    onSuccess: async () => {
      await refresh();
      toast.success(t('account.sessions.signedOutOthers'));
    },
    onError: () => toast.error(t('account.sessions.signOutFailed')),
  });

  const ordered = sessions.data
    ? orderSessions(sessions.data.sessions, sessions.data.currentToken)
    : [];
  const others = ordered.filter(({ token }) => token !== sessions.data?.currentToken);

  return (
    <SettingsGroup
      id="account-sessions"
      title={t('account.sessions.title')}
      count={sessions.data ? ordered.length : undefined}
    >
      {sessions.isPending ? (
        <Skeleton className="mt-1.5 h-[132px]" />
      ) : sessions.isError ? (
        <p className="text-ink-3 py-3 text-[0.8125rem]">{t('account.loadFailed')}</p>
      ) : (
        <>
          <ul className="mt-1.5">
            {ordered.map((session) => {
              const isHere = session.token === sessions.data.currentToken;
              const { device, browser, isPhone } = parseUserAgent(session.userAgent);
              const name = device ?? t('account.sessions.unknownDevice');
              return (
                <AccountItem
                  key={session.id}
                  icon={isPhone ? <PhoneIcon /> : <Monitor />}
                  title={browser ? `${name} · ${browser}` : name}
                  subtitle={
                    isHere ? (
                      <span className="text-ink-2 inline-flex items-center gap-1.5 font-semibold">
                        <i
                          aria-hidden
                          className="bg-pixel-on size-1.5 shadow-[0_0_6px_var(--pixel-glow)]"
                        />
                        {t('account.sessions.thisDevice')}
                      </span>
                    ) : (
                      t('account.sessions.active', {
                        when: formatRelative(
                          session.updatedAt,
                          now,
                          dateLocale(i18n.language),
                          t('account.sessions.justNow')
                        ),
                      })
                    )
                  }
                  action={
                    isHere ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={QUIET_DANGER_CLASSES}
                        aria-label={t('account.sessions.signOutOf', { device: name })}
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate({ token: session.token, device: name })}
                      >
                        {t('user.signOut')}
                      </Button>
                    )
                  }
                />
              );
            })}
          </ul>
          {others.length > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              className={`${QUIET_DANGER_CLASSES} mt-1.5 -ml-2.5`}
              disabled={revokeOthers.isPending}
              onClick={() => revokeOthers.mutate()}
            >
              <Logout />
              {t('account.sessions.signOutOthers', { count: others.length })}
            </Button>
          ) : null}
        </>
      )}
    </SettingsGroup>
  );
}
