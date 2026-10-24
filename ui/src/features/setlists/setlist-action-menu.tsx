import { Link } from '@tanstack/react-router';
import {
  Close,
  Copy,
  FolderPlus,
  Link as LinkIcon,
  PenSquare,
  Play,
  Trash,
} from 'pixelarticons/react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActionMenu,
  MenuClose,
  MenuRow,
  MenuSeparator,
  MenuTile,
} from '@/components/primitives/action-menu';
import { AuthorLine } from '@/components/primitives/author-line';
import { DateBlock } from '@/components/primitives/date-block';
import type { SetStatus } from '@/components/primitives/set-status';
import { SetStrip } from '@/components/primitives/set-strip';
import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import { dateLocale } from '@/lib/date-locale';

import { type SetlistSummary, setlistSlug } from './api';
import type { SetlistNames } from './setlist-row';
import type { useSetlistActions } from './use-setlist-actions';

type SetlistActionMenuProps = {
  session: Session;
  setlist: SetlistSummary;
  names: SetlistNames;
  status: SetStatus;
  actions: ReturnType<typeof useSetlistActions>;
  onEdit: () => void;
  trigger: ReactElement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// A setlist's menu: the set itself on top, its three everyday actions as tiles, then the rarer ones.
// Anchored to its ⋯ button on wide screens, a sheet from the bottom on phones (opened by a long-press).
export function SetlistActionMenu({
  session,
  setlist,
  names,
  status,
  actions,
  onEdit,
  trigger,
  open,
  onOpenChange,
}: SetlistActionMenuProps) {
  const { t, i18n } = useTranslation();
  const when = setlist.date
    ? new Intl.DateTimeFormat(dateLocale(i18n.language), {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date(setlist.date))
    : null;
  const songCount = t('reader.songCount', { count: setlist.songs.length });
  const maker =
    setlist.createdBy && setlist.createdBy !== session.id
      ? (names.people.get(setlist.createdBy) ?? t('setlists.shared'))
      : null;

  return (
    <ActionMenu
      align="end"
      title={setlist.name}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      showCloseButton={false}
      className="wide:w-[min(320px,calc(100vw-24px))]"
      header={
        <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-3 pt-1 pb-2">
          <DateBlock date={setlist.date} status={status} />
          <div className="min-w-0">
            <p className="mt-0.5 truncate text-base font-semibold">{setlist.name}</p>
            <p className="text-ink-2 mt-0.5 text-[0.8125rem]">
              {when ? `${when} · ` : null}
              {songCount}
            </p>
            <SetStrip status={status} titles={setlist.songs.map((song) => song.title)} />
          </div>
          <MenuClose>
            <Button variant="ghost" size="icon" aria-label={t('setlists.menu.close')}>
              <Close />
            </Button>
          </MenuClose>
        </div>
      }
    >
      <div className="mx-1">
        <div className="mb-2 grid grid-cols-3 gap-1.5">
          <MenuTile asChild>
            <Link to="/setlists/$setlistSlug" params={{ setlistSlug: setlistSlug(setlist) }}>
              <Play />
              {t('setlists.open')}
            </Link>
          </MenuTile>
          <MenuTile disabled={!actions.canShare} onSelect={actions.copyLink}>
            <LinkIcon />
            {t('setlists.share')}
          </MenuTile>
          <MenuTile disabled={!actions.canEdit} onSelect={onEdit}>
            <PenSquare />
            {t('editor.edit')}
          </MenuTile>
        </div>
        <MenuRow onSelect={actions.duplicate}>
          <Copy />
          {t('setlists.menu.duplicate')}
        </MenuRow>
        {actions.canEdit ? (
          <MenuRow onSelect={actions.requestFolders}>
            <FolderPlus />
            {t('setlists.menu.addToFolder')}
          </MenuRow>
        ) : null}
        {actions.canDelete ? (
          <>
            <MenuSeparator />
            <MenuRow tone="danger" onSelect={actions.requestDelete}>
              <Trash />
              {t('setlists.menu.delete')}
            </MenuRow>
          </>
        ) : maker ? (
          <p className="text-ink-3 mx-3 mt-2 mb-1 flex flex-wrap items-center gap-1 text-xs">
            <AuthorLine name={maker} />
            {actions.canEdit ? t('setlists.menu.madeThisEditable') : t('setlists.menu.madeThis')}
          </p>
        ) : null}
      </div>
    </ActionMenu>
  );
}
