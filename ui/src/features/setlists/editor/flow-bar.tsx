import { useTranslation } from 'react-i18next';

import { tempoLabelKey, tempoLevel } from '@/components/primitives/tempo-meter';
import { cn } from '@/lib/utils';

import type { DraftSong } from './setlist-draft';

const LEVELS = [4, 3, 2, 1] as const;

// The tempo through the set: one column of four bars per song, lit up to its tempo.
export function FlowBar({ songs }: { songs: readonly DraftSong[] }) {
  const { t } = useTranslation();
  if (songs.length === 0) return null;
  const tempos = songs
    .flatMap(({ tempo }) => {
      const key = tempoLabelKey(tempo);
      return key ? [t(key)] : [];
    })
    .join(', ');
  return (
    <figure
      aria-label={t('editor.flowLabel', { tempos })}
      className="m-0 mt-3 flex flex-wrap items-end gap-x-[3px] gap-y-1"
    >
      {songs.map((song, index) => {
        const level = tempoLevel(song.tempo);
        return (
          // A column's place in the set is its identity.
          // oxlint-disable-next-line react/no-array-index-key
          <span key={`${index}-${song._id}`} className="grid gap-0.5">
            {LEVELS.map((bar) => (
              <i key={bar} className={cn('h-1 w-2.5', bar <= level ? 'bg-ink-2' : 'bg-ink/15')} />
            ))}
          </span>
        );
      })}
      <span className="text-ink-3 ml-2 text-xs font-semibold">{t('editor.flow')}</span>
    </figure>
  );
}
