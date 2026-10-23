import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { listRowClasses, RowText } from '@/components/page/list-row';
import { AvatarStack } from '@/components/primitives/avatar';
import type { Session } from '@/features/auth/session';
import type { Folder } from '@/features/setlists/api';

import { membersOf, type Person } from './api';
import { FolderSleeve } from './folder-sleeve';

type FolderSummaryProps = {
  session: Session;
  folder: Folder;
  people: readonly Person[] | undefined;
};

const avatarPeople = (people: readonly Person[] | undefined, folderId: string) =>
  people
    ? membersOf(people, folderId).map(({ userId, fullName }) => ({ id: userId, name: fullName }))
    : [];

// Wide screens: a folder as a record sleeve with its name, setlist count and members under it.
export function FolderCard({ session, folder, people }: FolderSummaryProps) {
  const { t } = useTranslation();
  return (
    <Link
      to="/folders/$folderId"
      params={{ folderId: folder._id }}
      className="sleeve-host block w-full text-left"
    >
      <FolderSleeve folderId={folder._id} name={folder.groupName} size="card" />
      <span className="mt-2.5 block">
        <span className="block truncate font-semibold">{folder.groupName}</span>
        <span className="text-ink-2 mt-1 flex items-center justify-between gap-2 text-[0.8125rem]">
          <span>{t('folders.setlists', { count: folder.setlistIds.length })}</span>
          <AvatarStack people={avatarPeople(people, folder._id)} youId={session.id} />
        </span>
      </span>
    </Link>
  );
}

// Phones and side lists: a compact row with a small sleeve.
export function FolderRow({ session, folder, people }: FolderSummaryProps) {
  const { t } = useTranslation();
  const members = avatarPeople(people, folder._id);
  return (
    <Link
      to="/folders/$folderId"
      params={{ folderId: folder._id }}
      className={listRowClasses('sleeve-host min-h-[72px] grid-cols-[56px_minmax(0,1fr)_auto]')}
    >
      <FolderSleeve folderId={folder._id} name={folder.groupName} size="row" />
      <RowText
        title={folder.groupName}
        meta={
          <>
            {t('folders.setlists', { count: folder.setlistIds.length })}
            {people ? ` · ${t('folders.members', { count: members.length })}` : null}
          </>
        }
      />
      <AvatarStack people={members} youId={session.id} />
    </Link>
  );
}
