import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export type SetlistSongItem = { id: string; title: string; keyLabel: string };

type SetlistSongsProps = {
  songs: readonly SetlistSongItem[];
  currentIndex: number;
  onSelect: (songNumber: number) => void;
};

const pixelClasses = (index: number, currentIndex: number) =>
  index === currentIndex
    ? 'bg-pixel-on'
    : index < currentIndex
      ? 'bg-pixel-played'
      : 'bg-pixel-off';

// The set as rows: a pixel (lit for the song on screen, dimmer once played), number, title and key.
export function SetlistSongRows({ songs, currentIndex, onSelect }: SetlistSongsProps) {
  return (
    <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
      {songs.map((song, index) => (
        <li key={song.id}>
          <button
            type="button"
            onClick={() => onSelect(index + 1)}
            aria-current={index === currentIndex ? 'true' : undefined}
            className="hover:bg-fill-hover aria-[current]:bg-fill-on grid min-h-12 w-full grid-cols-[10px_22px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[14px] px-2.5 py-1.5 text-left text-[0.9375rem] transition-colors"
          >
            <span aria-hidden className={cn('size-2.5', pixelClasses(index, currentIndex))} />
            <span className="text-ink-3 font-mono text-[0.8125rem]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={cn('truncate', index === currentIndex && 'font-semibold')}>
              {song.title}
            </span>
            <span className="text-ink-2 font-mono text-[0.8125rem] font-semibold">
              {song.keyLabel}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

// Wide screens with the sidebar folded: every song as a pill in one row under the top row.
export function SetlistSongbar({ songs, currentIndex, onSelect }: SetlistSongsProps) {
  return (
    <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
      {songs.map((song, index) => (
        <button
          key={song.id}
          type="button"
          title={song.title}
          onClick={() => onSelect(index + 1)}
          aria-current={index === currentIndex ? 'true' : undefined}
          className="text-ink-2 hover:bg-fill-hover hover:text-ink aria-[current]:bg-fill-on aria-[current]:text-ink flex h-10 min-w-[170px] flex-[1_1_0] items-center gap-2 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors aria-[current]:font-semibold"
        >
          <span aria-hidden className={cn('size-2 flex-none', pixelClasses(index, currentIndex))} />
          <span className="text-ink-3 flex-none font-mono text-[0.8125rem]">{index + 1}</span>
          <span className="min-w-0 truncate">{song.title}</span>
          <span className="text-ink-2 ml-auto flex-none font-mono text-[0.8125rem] font-semibold">
            {song.keyLabel}
          </span>
        </button>
      ))}
    </div>
  );
}

// Phones: the set's progress as pixels under the top row, with the count at the end.
export function SetlistProgress({ songs, currentIndex, onSelect }: SetlistSongsProps) {
  const { t } = useTranslation();
  return (
    <>
      <ol
        aria-label={t('reader.progress')}
        className="m-0 flex flex-1 list-none items-center gap-1 p-0"
      >
        {songs.map((song, index) => (
          <li key={song.id} className="flex-1">
            <button
              type="button"
              aria-label={`${index + 1}. ${song.title}`}
              aria-current={index === currentIndex ? 'true' : undefined}
              onClick={() => onSelect(index + 1)}
              className="grid h-5 w-full items-center"
            >
              <span
                aria-hidden
                className={cn(
                  'h-1 transition-colors duration-[400ms]',
                  pixelClasses(index, currentIndex),
                  index === currentIndex && 'pixel-glow'
                )}
              />
            </button>
          </li>
        ))}
      </ol>
      <span className="text-ink-3 ml-1.5 flex-none font-mono text-xs">
        {currentIndex + 1}/{songs.length}
      </span>
    </>
  );
}
