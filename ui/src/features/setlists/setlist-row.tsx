import { Link, useNavigate } from '@tanstack/react-router';
import { Folder, Link as LinkIcon, MoreHorizontal, PenSquare, Trash } from 'pixelarticons/react';
import { type KeyboardEvent, type MouseEvent, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { listRowClasses } from '@/components/page/list-row';
import { AuthorLine } from '@/components/primitives/author-line';
import { DateBlock } from '@/components/primitives/date-block';
import type { SetStatus } from '@/components/primitives/set-status';
import { SetStrip } from '@/components/primitives/set-strip';
import { type SwipeAction, SwipeRow } from '@/components/primitives/swipe-row';
import { Tag } from '@/components/primitives/tag';
import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import { dateLocale } from '@/lib/date-locale';
import { cn } from '@/lib/utils';

import { type SetlistSummary, setlistSlug } from './api';
import { formatSetlistDate, toDateInputValue } from './format-date';
import { SetlistActionMenu } from './setlist-action-menu';
import { dayLinkHandlers, useSetlistList } from './setlist-list-context';
import { useSetlistActions } from './use-setlist-actions';

export type SetlistNames = {
  folders: ReadonlyMap<string, string>;
  people: ReadonlyMap<string, string>;
};

// On wide screens a click picks the row for the side preview; double-click and Enter open it.
const useRowPick = (setlist: SetlistSummary) => {
  const list = useSetlistList();
  const navigate = useNavigate();
  const { onSelect } = list;
  const day = toDateInputValue(setlist.date);
  const isSelected = list.selectedId === setlist._id;
  const isLit = day !== '' && list.litDay === day;
  const open = () =>
    void navigate({ to: '/setlists/$setlistSlug', params: { setlistSlug: setlistSlug(setlist) } });

  return {
    rowClassName: cn((isSelected || isLit) && 'liquid-on hover:liquid-on'),
    rowProps: day ? dayLinkHandlers(list, day) : {},
    linkProps: {
      'data-setlist-id': setlist._id,
      'aria-current': isSelected ? ('true' as const) : undefined,
      onClick: onSelect
        ? (event: MouseEvent<HTMLAnchorElement>) => {
            const isPlain =
              event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey);
            if (!isPlain || event.detail === 0) return;
            event.preventDefault();
            onSelect(setlist._id);
          }
        : undefined,
      onDoubleClick: onSelect ? open : undefined,
      onKeyDown: onSelect
        ? (event: KeyboardEvent<HTMLAnchorElement>) => {
            if (event.key !== ' ') return;
            event.preventDefault();
            onSelect(setlist._id);
          }
        : undefined,
    },
  };
};

type SetlistRowProps = {
  session: Session;
  setlist: SetlistSummary;
  names: SetlistNames;
  status: SetStatus;
  actions?: ReactNode;
  // Inside a folder, that folder's own tag is left out.
  hideFolderId?: string;
};

// A setlist as a row: its date tile, name, when and how many songs, who shared it, its folders and
// its songs as a strip of light. The whole row opens it; `actions` sit above the row's link.
export function SetlistRow({
  session,
  setlist,
  names,
  status,
  actions,
  hideFolderId,
}: SetlistRowProps) {
  const { t, i18n } = useTranslation();
  const { rowClassName, rowProps, linkProps } = useRowPick(setlist);
  const weekday = setlist.date
    ? new Intl.DateTimeFormat(dateLocale(i18n.language), { weekday: 'short' }).format(
        new Date(setlist.date)
      )
    : null;
  const sharedBy =
    setlist.createdBy && setlist.createdBy !== session.id
      ? (names.people.get(setlist.createdBy) ?? t('setlists.shared'))
      : null;
  const folders = setlist.groupIds.flatMap((id) => {
    const name = names.folders.get(id);
    return name && id !== hideFolderId ? [{ id, name }] : [];
  });

  return (
    <div
      {...rowProps}
      className={listRowClasses(
        cn('group/row grid-cols-[52px_minmax(0,1fr)_auto] items-start', rowClassName)
      )}
    >
      <DateBlock date={setlist.date} status={status} />
      <span className="min-w-0">
        <Link
          to="/setlists/$setlistSlug"
          params={{ setlistSlug: setlistSlug(setlist) }}
          {...linkProps}
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
          {sharedBy ? <AuthorLine name={sharedBy} /> : null}
          {folders.map(({ id, name }) => (
            <Tag key={id} title={name}>
              <Folder />
              <span className="max-w-[24ch] truncate">{name}</span>
            </Tag>
          ))}
        </span>
        <SetStrip status={status} titles={setlist.songs.map((song) => song.title)} />
      </span>
      <span className="relative z-10 flex items-center gap-0.5 self-center">{actions}</span>
    </div>
  );
}

// A played setlist as one quiet line: its date, name and strip.
export function PlayedSetlistRow({ setlist, actions }: SetlistRowProps) {
  const { i18n } = useTranslation();
  const { rowClassName, rowProps, linkProps } = useRowPick(setlist);
  const date = setlist.date ? new Date(setlist.date) : null;
  const dateLabel = date
    ? new Intl.DateTimeFormat(dateLocale(i18n.language), { day: 'numeric', month: 'short' }).format(
        date
      )
    : null;
  const fullDate = formatSetlistDate(setlist.date, i18n.language);

  return (
    <div
      {...rowProps}
      className={listRowClasses(
        cn('group/row min-h-12 grid-cols-[64px_minmax(0,1fr)_auto] px-3 py-1', rowClassName)
      )}
    >
      <span className="text-ink-3 font-mono text-[0.8125rem]">{dateLabel}</span>
      <Link
        to="/setlists/$setlistSlug"
        params={{ setlistSlug: setlistSlug(setlist) }}
        {...linkProps}
        aria-label={fullDate ? `${setlist.name}, ${fullDate}` : setlist.name}
        className="text-ink-2 truncate font-medium outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:shadow-[inset_2px_0_0_var(--chord)]"
      >
        {setlist.name}
      </Link>
      <span className="relative z-10 flex items-center gap-0.5">
        <SetStrip
          status="past"
          titles={setlist.songs.map((song) => song.title)}
          className="mt-0 justify-end"
        />
        {actions}
      </span>
    </div>
  );
}

// A row in the Setlists list: a ⋯ menu that shows on hover (wide), swipe actions (phones).
export function ManagedSetlistRow({
  compact = false,
  ...props
}: Omit<SetlistRowProps, 'actions'> & { compact?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setlist } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const actions = useSetlistActions(props.session, setlist);
  const edit = () =>
    void navigate({
      to: '/setlists/$setlistSlug/edit',
      params: { setlistSlug: setlistSlug(setlist) },
    });

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
    <SetlistActionMenu
      session={props.session}
      setlist={setlist}
      names={props.names}
      status={props.status}
      actions={actions}
      onEdit={edit}
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
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
    />
  );

  return (
    <>
      <SwipeRow actions={swipeActions} onLongPress={() => setIsMenuOpen(true)}>
        {compact ? (
          <PlayedSetlistRow {...props} actions={menu} />
        ) : (
          <SetlistRow {...props} actions={menu} />
        )}
      </SwipeRow>
      {actions.confirmDelete}
      {actions.folderDialog}
    </>
  );
}
