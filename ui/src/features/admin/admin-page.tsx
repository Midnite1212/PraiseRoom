import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page/page-header';
import { Segmented } from '@/components/primitives/segmented';
import { isSuper, type Session } from '@/features/auth/session';

import { MemberRoles } from './member-roles';
import { SongReview } from './song-review';

export const ADMIN_TABS = ['songs', 'members'] as const;

export type AdminTab = (typeof ADMIN_TABS)[number];

// Songs for admins and supers; Members only for supers, so anyone else always sees Songs.
export function AdminPage({
  session,
  tab,
  onTabChange,
}: {
  session: Session;
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}) {
  const { t } = useTranslation();
  const canManageRoles = isSuper(session);
  const shown = canManageRoles ? tab : 'songs';
  return (
    <>
      <PageHeader title={t('admin.title')} />
      {canManageRoles ? (
        <Segmented
          value={shown}
          onChange={onTabChange}
          label={t('admin.sections')}
          className="mb-4"
          options={[
            { value: 'songs', label: t('admin.songs.tab') },
            { value: 'members', label: t('admin.members.tab') },
          ]}
        />
      ) : null}
      {shown === 'members' ? <MemberRoles session={session} /> : <SongReview />}
    </>
  );
}
