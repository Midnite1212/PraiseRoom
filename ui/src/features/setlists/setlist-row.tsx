import { Link, useNavigate } from '@tanstack/react-router';
import {
  Bulletlist,
  Folder,
  Link as LinkIcon,
  MoreHorizontal,
  PenSquare,
  Trash,
  Users,
} from 'pixelarticons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { listRowClasses } from '@/components/page/list-row';
import { ActionMenu, MenuRow, MenuSeparator } from '@/components/primitives/action-menu';
import { DateBlock } from '@/components/primitives/date-block';
import { type SwipeAction, SwipeRow } from '@/components/primitives/swipe-row';
import { Tag } from '@/components/primitives/tag';
import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';

import type { SetlistSummary } from './api';
import { formatSetlistDate } from './format-date';
import { useSetlistActions } from './use-setlist-actions';

export type SetlistNames = {
  folders: ReadonlyMap<string, string>;
  people: ReadonlyMap<string, string>;
};

type SetlistRowProps = {
  session: Session;
  setlist: SetlistSummary;
  names: SetlistNames;
  now: number;
  actions?: ReactNode;
};

// A setlist as a row: its date tile, name, when and how many songs, who shared it and its folders.
// The whole row opens it; `actions` sit above the row's link.
export function SetlistRow({ session, setlist, names, now, actions }: SetlistRowProps) {
  const { t, i18n } = useTranslation();
  const weekday = setlist.date
    ? new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(new Date(setlist.date))
    : null;
  const sharedBy =
    setlist.createdBy && setlist.createdBy !== session.id
      ? (names.people.get(setlist.createdBy) ?? t('setlists.shared'))
      : null;
  const folders = setlist.groupIds.flatMap((id) => {
    const name = names.folders.get(id);
    return name ? [{ id, name }] : [];
  });

  return (
    <div className={listRowClasses('group/row grid-cols-[52px_minmax(0,1fr)_auto]')}>
      <DateBlock date={setlist.date} now={now} />
      <span className="min-w-0">
        <Link
          to="/setlists/$setlistId"
          params={{ setlistId: setlist._id }}
          aria-label={
            setlist.date
              ? `${setlist.name}, ${formatSetlistDate(setlist.date, i18n.language) ?? ''}`
              : setlist.name
          }
          className="block truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:shadow-[inset_2px_0_0_var(--chord)]"
        >
          {setlist.name}
        </Link>
        <span className="text-ink-2 mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem]">
          <span>
            {weekday ? `${weekday} · ` : null}
            {t('reader.songCount', { count: setlist.songs.length })}
          </span>
          {sharedBy ? (
            <Tag>
              <Users />
              {sharedBy}
            </Tag>
          ) : null}
          {folders.map(({ id, name }) => (
            <Tag key={id}>
              <Folder />
              {name}
            </Tag>
          ))}
        </span>
      </span>
      <span className="relative z-10 flex items-center gap-0.5">{actions}</span>
    </div>
  );
}

// A row in the Setlists list: a ⋯ menu that shows on hover (wide), swipe actions (phones).
export function ManagedSetlistRow(props: Omit<SetlistRowProps, 'actions'>) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setlist } = props;
  const actions = useSetlistActions(props.session, setlist);
  const edit = () =>
    void navigate({ to: '/setlists/$setlistId/edit', params: { setlistId: setlist._id } });

  const swipeActions: SwipeAction[] = [
    ...(actions.canEdit
      ? [{ key: 'edit', label: t('editor.edit'), icon: <PenSquare />, onSelect: edit }]
      : []),
    ...(actions.canShare
      ? [
          {
            key: 'share',
            label: t('setlists.share'),
            icon: <LinkIcon />,
            onSelect: actions.copyLink,
          },
        ]
      : []),
    ...(actions.canDelete
      ? [
          {
            key: 'delete',
            label: t('setlists.delete'),
            icon: <Trash />,
            onSelect: actions.requestDelete,
            tone: 'danger' as const,
          },
        ]
      : []),
  ];

  const menu = (
    <ActionMenu
      align="end"
      title={setlist.name}
      description={
        setlist.date
          ? new Intl.DateTimeFormat(i18n.language, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date(setlist.date))
          : t('setlists.noDate')
      }
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('setlists.actions', { name: setlist.name })}
          title={t('setlists.more')}
          className="wide:inline-flex hidden opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
        >
          <MoreHorizontal />
        </Button>
      }
    >
      <MenuRow asChild>
        <Link to="/setlists/$setlistId" params={{ setlistId: setlist._id }}>
          <Bulletlist />
          {t('setlists.open')}
        </Link>
      </MenuRow>
      {actions.canEdit ? (
        <MenuRow onSelect={edit}>
          <PenSquare />
          {t('editor.edit')}
        </MenuRow>
      ) : null}
      {actions.canShare ? (
        <MenuRow onSelect={actions.copyLink}>
          <LinkIcon />
          {t('reader.copyLink')}
        </MenuRow>
      ) : null}
      {actions.canDelete ? (
        <>
          <MenuSeparator />
          <MenuRow tone="danger" onSelect={actions.requestDelete}>
            <Trash />
            {t('setlists.delete')}
          </MenuRow>
        </>
      ) : null}
    </ActionMenu>
  );

  return (
    <>
      <SwipeRow actions={swipeActions}>
        <SetlistRow {...props} actions={menu} />
      </SwipeRow>
      {actions.confirmDelete}
    </>
  );
}
