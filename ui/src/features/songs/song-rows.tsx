import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { LIST_CLASSES, listRowClasses, RowKey, RowText } from '@/components/page/list-row';

import type { SongSummary } from './api';

// Phones (and narrow lists such as Home): one row per song, its key at the end.
export function SongRows({ songs }: { songs: readonly SongSummary[] }) {
  const { t } = useTranslation();
  if (songs.length === 0)
    return <EmptyState title={t('songs.empty')}>{t('songs.emptyHint')}</EmptyState>;
  return (
    <ul className={LIST_CLASSES}>
      {songs.map((song) => (
        <li key={song._id}>
          <Link
            to="/songs/$songId"
            params={{ songId: song._id }}
            className={listRowClasses('grid-cols-[minmax(0,1fr)_auto]')}
          >
            <RowText title={song.title} meta={song.artist} />
            <RowKey>{song.originalKey}</RowKey>
          </Link>
        </li>
      ))}
    </ul>
  );
}
