import { Link } from '@tanstack/react-router';
import { Logout, SettingsCog } from 'pixelarticons/react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionMenu, MenuRow, MenuSeparator } from '@/components/primitives/action-menu';
import { toInitials } from '@/components/primitives/avatar';
import { Vinyl } from '@/components/primitives/vinyl';
import type { Session } from '@/features/auth/session';
import { useSignOut } from '@/features/auth/use-sign-out';

import { LanguageChoice, ThemeChoice } from './preference-choices';

// Your profile: who you are, theme and language for this device, Settings, and Sign out.
export function ProfileMenu({ session, trigger }: { session: Session; trigger: ReactElement }) {
  const { t } = useTranslation();
  const signOut = useSignOut();

  return (
    <ActionMenu
      trigger={trigger}
      align="start"
      leading={<Vinyl initial={toInitials(session.fullName)} size="lg" spinning />}
      title={session.fullName}
      description={`${t(`user.accessType.${session.accessType}`)} · ${session.email}`}
    >
      <div className="flex flex-col gap-2 px-1 pt-1">
        <p className="text-ink-3 mx-1 text-xs font-semibold">{t('theme.label')}</p>
        <ThemeChoice fullWidth />
        <p className="text-ink-3 mx-1 mt-1 text-xs font-semibold">{t('language.label')}</p>
        <LanguageChoice fullWidth />
      </div>
      <MenuSeparator />
      <MenuRow asChild>
        <Link to="/settings">
          <SettingsCog />
          {t('user.settings')}
        </Link>
      </MenuRow>
      <MenuRow tone="danger" onSelect={() => void signOut()}>
        <Logout />
        {t('user.signOut')}
      </MenuRow>
    </ActionMenu>
  );
}
