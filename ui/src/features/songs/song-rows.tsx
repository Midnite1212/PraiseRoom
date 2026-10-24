import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { LIST_CLASSES, listRowClasses } from '@/components/page/list-row';
import { KeyTile } from '@/components/primitives/key-chip';
import { TempoMeter } from '@/components/primitives/tempo-meter';
import { cn } from '@/lib/utils';

import type { SongSort, SongSummary } from './api';
import { LetterScrubber } from './letter-scrubber';
import { groupSongs } from './song-groups';

function SongRow({ song, inNextSet }: { song: SongSummary; inNextSet: boolean }) {
  const { t } = useTranslation();
  return (
    <li>
      <Link
        to="/songs/$songId"
        params={{ songId: song._id }}
        className={listRowClasses('min-h-14 grid-cols-[2.75rem_minmax(0,1fr)_auto]')}
      >
        <KeyTile
          musicKey={song.originalKey}
          timeSignature={song.timeSignature[0]}
          className={cn(inNextSet && 'ring-brand/45 ring-1 ring-inset')}
        />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{song.title}</span>
          <span className="text-ink-2 mt-[3px] flex min-w-0 items-center gap-2.5 text-[0.8125rem]">
            <span className="truncate">{song.artist}</span>
            {inNextSet ? (
              <span className="text-ink inline-flex flex-none items-center gap-1.5 font-semibold">
                <i aria-hidden className="bg-pixel-on pixel-glow size-1.5" />
                {t('songs.nextSet')}
              </span>
            ) : null}
          </span>
        </span>
        <span aria-hidden className="grid justify-items-end gap-1.5">
          {song.code ? (
            <span className="text-ink-3 font-mono text-xs font-semibold">{song.code}</span>
          ) : null}
          <TempoMeter tempo={song.tempo} />
        </span>
      </Link>
    </li>
  );
}

// Phones: one row per song, led by its key. With `grouped`, the list gets a heading per run of the
// current sort and a letter strip to jump between the groups already loaded.
export function SongRows({
  songs,
  sort,
  grouped = false,
  nextSetSongIds,
}: {
  songs: readonly SongSummary[];
  sort: SongSort;
  grouped?: boolean;
  nextSetSongIds: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  if (songs.length === 0)
    return <EmptyState title={t('songs.empty')}>{t('songs.emptyHint')}</EmptyState>;

  const groups = grouped ? groupSongs(songs, sort, t) : null;
  if (!groups)
    return (
      <ul className={LIST_CLASSES}>
        {songs.map((song) => (
          <SongRow key={song._id} song={song} inNextSet={nextSetSongIds.has(song._id)} />
        ))}
      </ul>
    );

  return (
    <>
      {groups.map((group, index) => (
        <section
          key={group.id}
          id={group.id}
          aria-labelledby={`${group.id}-title`}
          className="scroll-mt-[calc(var(--top)+118px)]"
        >
          <h3
            id={`${group.id}-title`}
            className={cn(
              'm-0 mb-1 flex items-center gap-3 px-3 font-mono text-[0.8125rem] font-bold after:order-1 after:h-px after:flex-1 after:bg-hairline after:content-[""]',
              index === 0 ? 'mt-2' : 'mt-6'
            )}
          >
            {group.label}
            <small className="text-ink-3 order-2 text-xs font-bold">{group.songs.length}</small>
          </h3>
          <ul className={LIST_CLASSES}>
            {group.songs.map((song) => (
              <SongRow key={song._id} song={song} inNextSet={nextSetSongIds.has(song._id)} />
            ))}
          </ul>
        </section>
      ))}
      {sort === 'title' && groups.length > 1 ? <LetterScrubber groups={groups} /> : null}
    </>
  );
}
