import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Close, Folder, Link as LinkIcon, PenSquare, Play } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { DateBlock } from '@/components/primitives/date-block';
import { setStatus, whenLabel } from '@/components/primitives/set-status';
import { Tag } from '@/components/primitives/tag';
import { TempoMeter } from '@/components/primitives/tempo-meter';
import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import { dateLocale } from '@/lib/date-locale';

import { keyForSong, noteForSong, setlistQueryOptions, type SetlistSummary } from './api';
import type { SetlistNames } from './setlist-row';
import { useSetlistActions } from './use-setlist-actions';

type SetlistPreviewProps = {
  session: Session;
  setlist: SetlistSummary;
  names: SetlistNames;
  nextId: string | null;
  now: number;
  onClose: () => void;
};

// Wide Setlists: the picked setlist in full beside the list. The list already has its songs'
// titles; the detail request adds each song's tempo, the key it is played in, and its note.
export function SetlistPreview({
  session,
  setlist,
  names,
  nextId,
  now,
  onClose,
}: SetlistPreviewProps) {
  const { t, i18n } = useTranslation();
  const actions = useSetlistActions(session, setlist);
  const { data: detail } = useQuery(setlistQueryOptions(setlist._id));
  const status = setStatus(setlist, nextId, now);
  const folders = setlist.groupIds.flatMap((id) => {
    const name = names.folders.get(id);
    return name ? [{ id, name }] : [];
  });
  const maker =
    setlist.createdBy && setlist.createdBy !== session.id
      ? (names.people.get(setlist.createdBy) ?? t('setlists.shared'))
      : null;
  const when = setlist.date
    ? [
        new Intl.DateTimeFormat(dateLocale(i18n.language), {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }).format(new Date(setlist.date)),
        whenLabel(setlist.date, now, i18n.language),
      ].join(' · ')
    : t('setlists.preview.noDate');
  const detailSongs = new Map(detail?.songs.map((song) => [song._id, song]));
  const seen = new Map<string, number>();
  const songs = setlist.songs.map((song) => {
    const count = (seen.get(song._id) ?? 0) + 1;
    seen.set(song._id, count);
    const full = detailSongs.get(song._id);
    return {
      key: `${song._id}-${count}`,
      title: song.title,
      tempo: full?.tempo ?? [],
      musicKey: detail && full ? keyForSong(detail, full) : null,
      note: detail ? noteForSong(detail, song._id) : '',
    };
  });

  return (
    <aside aria-label={t('setlists.preview.label', { name: setlist.name })} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label={t('setlists.preview.close')}
        title={t('setlists.preview.closeHint')}
        className="absolute -top-1 right-0 z-[2]"
      >
        <Close />
      </Button>
      <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3.5 pr-10">
        <DateBlock date={setlist.date} status={status} />
        <div className="min-w-0">
          <h2 className="text-card-title m-0 font-bold tracking-[-0.02em]">{setlist.name}</h2>
          <p className="text-ink-2 mt-1 mb-0">{when}</p>
        </div>
      </div>
      <p className="text-ink-2 mt-3 mb-0 flex flex-wrap items-center gap-1.5 text-[0.8125rem]">
        {maker ? t('setlists.preview.from', { name: maker }) : t('setlists.preview.youMadeThis')}
        {folders.length > 0 ? (
          <>
            <span aria-hidden>·</span>
            {t('setlists.preview.inFolders')}
            {folders.map(({ id, name }) => (
              <Link
                key={id}
                to="/folders/$folderId"
                params={{ folderId: id }}
                className="rounded-full"
              >
                <Tag className="hover:bg-fill-press hover:text-ink">
                  <Folder />
                  {name}
                </Tag>
              </Link>
            ))}
          </>
        ) : null}
      </p>
      <div className="mt-4 mb-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link
            to="/setlists/$setlistId"
            params={{ setlistId: setlist._id }}
            aria-label={t('setlists.preview.openNamed', { name: setlist.name })}
          >
            <Play />
            {t('setlists.open')}
          </Link>
        </Button>
        {actions.canEdit ? (
          <Button asChild variant="secondary">
            <Link to="/setlists/$setlistId/edit" params={{ setlistId: setlist._id }}>
              <PenSquare />
              {t('editor.edit')}
            </Link>
          </Button>
        ) : null}
        {actions.canShare ? (
          <Button variant="secondary" onClick={actions.copyLink}>
            <LinkIcon />
            {t('setlists.share')}
          </Button>
        ) : null}
      </div>
      {songs.length > 0 ? (
        <ol className="m-0 grid list-none gap-0.5 p-0">
          {songs.map((song, index) => (
            <li
              key={song.key}
              className="bg-fill-hover text-ui grid min-h-9 grid-cols-[22px_minmax(0,1fr)_auto_28px] items-center gap-2.5 rounded-xl px-2.5"
            >
              <span className="text-ink-3 font-mono text-[0.8125rem] font-semibold">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{song.title}</span>
                {song.note === '' ? null : (
                  <small className="text-ink-3 block truncate text-xs">{song.note}</small>
                )}
              </span>
              <TempoMeter tempo={song.tempo} />
              <span className="text-ink-2 text-right font-mono text-[0.8125rem] font-semibold">
                {song.musicKey}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title={t('setlists.preview.noSongs')}>
          {t('setlists.preview.noSongsHint')}
        </EmptyState>
      )}
    </aside>
  );
}
