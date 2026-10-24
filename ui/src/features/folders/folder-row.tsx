import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { listRowClasses, RowText } from '@/components/page/list-row';
import { AvatarStack } from '@/components/primitives/avatar';
import type { Session } from '@/features/auth/session';
import type { Folder } from '@/features/setlists/api';
import { dateLocale } from '@/lib/date-locale';
import { cn } from '@/lib/utils';

import { membersOf, type Person } from './api';
import { FolderSleeve } from './folder-sleeve';
import { useFolderCover } from './use-folder-cover';

type FolderRowProps = {
  session: Session;
  folder: Folder;
  people: readonly Person[] | undefined;
  now: number;
  // Wide Folders page: the row selects the folder in the pane (a search param) instead of opening its page.
  pane?: { selected: boolean; isOpen: boolean };
};

const avatarPeople = (people: readonly Person[] | undefined, folderId: string) =>
  people
    ? membersOf(people, folderId).map(({ userId, fullName }) => ({ id: userId, name: fullName }))
    : [];

// "3 setlists · next 29 Oct"
function FolderMeta({ count, nextDate }: { count: number; nextDate: string | null }) {
  const { t, i18n } = useTranslation();
  const next = nextDate
    ? new Intl.DateTimeFormat(dateLocale(i18n.language), { day: 'numeric', month: 'short' }).format(
        new Date(nextDate)
      )
    : null;
  return (
    <>
      {t('folders.setlists', { count })}
      {next ? ` · ${t('folders.nextDate', { date: next })}` : null}
    </>
  );
}

// A folder as a row with a small sleeve. In the Folders pane an open pane drops the members to make room.
export function FolderRow({ session, folder, people, now, pane }: FolderRowProps) {
  const { cells, nextDate } = useFolderCover(folder, now);
  const members = avatarPeople(people, folder._id);
  const className = listRowClasses(
    cn(
      'sleeve-host min-h-[72px]',
      pane?.isOpen ? 'grid-cols-[56px_minmax(0,1fr)]' : 'grid-cols-[56px_minmax(0,1fr)_auto]',
      pane?.selected && 'liquid-on hover:liquid-on'
    )
  );
  const content = (
    <>
      <FolderSleeve cells={cells} size="row" />
      <RowText
        title={folder.groupName}
        meta={<FolderMeta count={folder.setlistIds.length} nextDate={nextDate} />}
      />
      {pane?.isOpen ? null : <AvatarStack people={members} youId={session.id} />}
    </>
  );
  return pane ? (
    <Link
      to="/folders"
      search={{ folder: folder._id }}
      data-folder-row={folder._id}
      aria-current={pane.selected ? 'true' : undefined}
      className={className}
    >
      {content}
    </Link>
  ) : (
    <Link to="/folders/$folderId" params={{ folderId: folder._id }} className={className}>
      {content}
    </Link>
  );
}
