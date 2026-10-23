import { Link } from '@tanstack/react-router';
import { ChevronRight, Logout, SettingsCog } from 'pixelarticons/react';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionMenu, MenuRow, MenuSeparator } from '@/components/primitives/action-menu';
import { toInitials } from '@/components/primitives/avatar';
import { Vinyl } from '@/components/primitives/vinyl';
import type { Session } from '@/features/auth/session';
import { useSignOut } from '@/features/auth/use-sign-out';

import { LanguageChoice, ThemeChoice } from './preference-choices';

function PreferenceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 pl-3">
      <span className="font-semibold">{label}</span>
      {children}
    </div>
  );
}

// Your profile: who you are, appearance and language for this device, Settings, and Sign out.
export function ProfileMenu({ session, trigger }: { session: Session; trigger: ReactElement }) {
  const { t } = useTranslation();
  const signOut = useSignOut();

  return (
    <ActionMenu
      trigger={trigger}
      align="start"
      title={session.fullName}
      showCloseButton={false}
      header={
        <MenuRow asChild className="min-h-0 gap-3.5 rounded-2xl py-2 pr-2.5 pl-2">
          <Link to="/settings">
            <Vinyl initial={toInitials(session.fullName)} size="lg" spinning />
            <span className="min-w-0 flex-1">
              <b className="block truncate text-base">{session.fullName}</b>
              <small className="text-ink-2 block truncate text-[0.8125rem] font-normal">
                {session.email}
              </small>
              <span className="bg-fill-on mt-1.5 inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold">
                {t(`user.accessType.${session.accessType}`)}
              </span>
            </span>
            <ChevronRight className="text-ink-3" />
          </Link>
        </MenuRow>
      }
    >
      <PreferenceRow label={t('user.appearance')}>
        <ThemeChoice compact />
      </PreferenceRow>
      <PreferenceRow label={t('language.label')}>
        <LanguageChoice compact />
      </PreferenceRow>
      <MenuRow asChild>
        <Link to="/settings">
          <SettingsCog />
          <span className="min-w-0 flex-1">
            {t('user.settings')}
            <small className="text-ink-3 block text-xs font-normal">{t('user.settingsHint')}</small>
          </span>
          <ChevronRight className="text-ink-3" />
        </Link>
      </MenuRow>
      <MenuSeparator />
      <MenuRow onSelect={() => void signOut()} className="text-ink-2">
        <Logout />
        {t('user.signOut')}
      </MenuRow>
    </ActionMenu>
  );
}
