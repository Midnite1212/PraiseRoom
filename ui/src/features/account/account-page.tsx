import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { AppBarSlot } from '@/components/layout/app-bar-slots';
import { BACK_LINK_CLASSES, BackLabel } from '@/components/page/back-link';
import { PAGE_TITLE_CLASSES } from '@/components/page/page-header';
import { toInitials } from '@/components/primitives/avatar';
import { Vinyl } from '@/components/primitives/vinyl';
import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import { foldersQueryOptions, setlistsQueryOptions } from '@/features/setlists/api';
import { SettingsGroup } from '@/features/settings/settings-group';

import { accountCounts } from './counts';
import { DeleteAccount } from './delete-account';
import { ProfileSection } from './profile-section';
import { SessionsSection } from './sessions-section';
import { SignInMethods } from './sign-in-methods';

const ROLE_PILL_CLASSES = 'bg-fill-on rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold';

export function AccountBack({ to, label }: { to: '/settings' | '/account'; label: string }) {
  return (
    <>
      <AppBarSlot side="left">
        <Button asChild variant="glass" size="icon-lg">
          <Link to={to} aria-label={label}>
            <ChevronLeft />
          </Link>
        </Button>
      </AppBarSlot>
      <Link to={to} className={BACK_LINK_CLASSES}>
        <BackLabel>{label}</BackLabel>
      </Link>
    </>
  );
}

// Who you are, how you sign in, where you are signed in, and what your role allows.
export function AccountPage({ session }: { session: Session }) {
  const { t } = useTranslation();
  const setlists = useQuery(setlistsQueryOptions());
  const folders = useQuery(foldersQueryOptions());
  const counts =
    setlists.data && folders.data ? accountCounts(session, setlists.data, folders.data) : undefined;

  return (
    <>
      <AccountBack to="/settings" label={t('settings.title')} />
      <div className="grid max-w-[640px] gap-9">
        <header className="border-hairline flex items-center gap-[18px] border-b pb-6">
          <Vinyl initial={toInitials(session.fullName)} size="lg" className="[--v:64px]" />
          <div className="min-w-0">
            <h1 data-page-title className={`${PAGE_TITLE_CLASSES} leading-[1.08] break-words`}>
              {session.fullName}
            </h1>
            <p className="text-ink-2 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className={ROLE_PILL_CLASSES}>
                {t(`user.accessType.${session.accessType}`)}
              </span>
              {counts
                ? t('account.hero.counts', {
                    folders: t('account.count.folders', { count: counts.folders }),
                    setlists: t('account.count.setlists', { count: counts.setlistsMade }),
                  })
                : null}
            </p>
          </div>
        </header>
        <ProfileSection session={session} />
        <SignInMethods session={session} />
        <SessionsSection />
        <SettingsGroup id="account-access" title={t('account.access.title')}>
          <p className="mt-3 flex items-baseline gap-2.5 leading-normal">
            <span className={`${ROLE_PILL_CLASSES} flex-none`}>
              {t(`user.accessType.${session.accessType}`)}
            </span>
            <span className="text-ink-2">{t(`account.access.${session.accessType}`)}</span>
          </p>
        </SettingsGroup>
        <DeleteAccount counts={counts} />
      </div>
    </>
  );
}
