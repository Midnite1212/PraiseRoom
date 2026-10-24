import { ChevronDown } from 'pixelarticons/react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Panel } from '@/components/primitives/panel';
import type { MusicKey } from '@/features/chords/theory';
import { useSongCapo } from '@/features/reader/song-capo';
import { SongReader } from '@/features/reader/song-reader';
import { cn } from '@/lib/utils';

import type { SetlistSong } from '../api';
import { SetlistPickRows, type SetlistSongItem } from './setlist-songs';
import { rightPickIndexes } from './split-panes';

const paneClasses =
  'relative min-w-0 overflow-y-auto overscroll-contain px-[clamp(20px,2.6vw,44px)] pt-5 pb-20 [mask-image:linear-gradient(transparent,#000_16px,#000_calc(100%-48px),transparent)] [scrollbar-width:thin]';

type PaneChooserProps = {
  label: string;
  isPinned?: boolean;
  title: string;
  children: (close: () => void) => ReactNode;
};

// "Song 2 of 6", with a pin once the song is held there; opens a panel to choose the song.
function PaneChooser({ label, isPinned = false, title, children }: PaneChooserProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <Panel
        open={isOpen}
        onOpenChange={setIsOpen}
        align="start"
        title={title}
        trigger={
          <button
            type="button"
            className="text-ink-2 hover:text-ink hover:liquid-hover -ml-2.5 inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[0.8125rem] font-semibold"
          >
            {isPinned ? <span aria-hidden className="bg-chord size-1.5" /> : null}
            {isPinned ? `${label} · ${t('reader.pinned')}` : label}
            <ChevronDown className="size-4" />
          </button>
        }
      >
        {children(() => setIsOpen(false))}
      </Panel>
    </div>
  );
}

type SplitSongProps = {
  entry: SetlistSong;
  pane: 'left' | 'right';
  playKey: MusicKey | null;
  onPlayKeyChange: (key: MusicKey) => void;
  note: string;
};

function SplitSong({ entry, pane, playKey, onPlayKeyChange, note }: SplitSongProps) {
  const [capo, changeCapo] = useSongCapo(entry._id, entry.capo);
  return (
    <SongReader
      song={entry}
      pane={pane}
      playKey={playKey}
      onPlayKeyChange={onPlayKeyChange}
      capo={capo}
      onCapoChange={changeCapo}
      note={note}
    />
  );
}

type SplitViewProps = {
  entries: readonly SetlistSong[];
  songs: readonly SetlistSongItem[];
  currentIndex: number;
  // Null past the last song: the right pane reads "End of the set".
  rightIndex: number | null;
  isPinned: boolean;
  playKeyFor: (index: number) => MusicKey | null;
  onPlayKeyChange: (songId: string, key: MusicKey) => void;
  noteFor: (songId: string) => string;
  onPlay: (index: number) => void;
  // A song to hold in the right pane, or null to follow the set.
  onShowBeside: (songId: string | null) => void;
  // The left pane's scroll container, which auto-scroll moves.
  leftPaneRef: (element: HTMLElement | null) => void;
};

// Two songs with equal weight, each scrolling on its own: the current song on the left, the next song or a
// pinned one on the right. Each pane's chooser picks its song.
export function SplitView({
  entries,
  songs,
  currentIndex,
  rightIndex,
  isPinned,
  playKeyFor,
  onPlayKeyChange,
  noteFor,
  onPlay,
  onShowBeside,
  leftPaneRef,
}: SplitViewProps) {
  const { t } = useTranslation();
  const left = entries[currentIndex];
  const right = rightIndex === null ? undefined : entries[rightIndex];
  if (!left) return null;

  return (
    <>
      <article
        ref={leftPaneRef}
        key={left._id}
        aria-labelledby="song-title"
        className={paneClasses}
      >
        <PaneChooser
          label={t('reader.songOf', { current: currentIndex + 1, total: entries.length })}
          title={t('reader.playNow')}
        >
          {(close) => (
            <SetlistPickRows
              songs={songs}
              indexes={songs.map((_, index) => index)}
              currentIndex={currentIndex}
              selectedIndex={currentIndex}
              onSelect={(index) => {
                close();
                onPlay(index);
              }}
            />
          )}
        </PaneChooser>
        <SplitSong
          entry={left}
          pane="left"
          playKey={playKeyFor(currentIndex)}
          onPlayKeyChange={(key) => onPlayKeyChange(left._id, key)}
          note={noteFor(left._id)}
        />
      </article>
      <aside
        key={right ? `${right._id}:${rightIndex}` : 'end'}
        className={cn(paneClasses, 'border-hairline border-l')}
      >
        <PaneChooser
          label={
            right && rightIndex !== null
              ? t('reader.songOf', { current: rightIndex + 1, total: entries.length })
              : t('reader.endOfSet')
          }
          isPinned={isPinned}
          title={t('reader.showBeside')}
        >
          {(close) => (
            <SetlistPickRows
              songs={songs}
              indexes={rightPickIndexes(songs.length, currentIndex)}
              currentIndex={currentIndex}
              selectedIndex={isPinned ? rightIndex : null}
              onSelect={(index) => {
                close();
                onShowBeside(songs[index]?.id ?? null);
              }}
            >
              <li>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onShowBeside(null);
                  }}
                  aria-current={isPinned ? undefined : 'true'}
                  className="text-chord hover:bg-fill-hover aria-[current]:bg-fill-on min-h-12 w-full rounded-[14px] px-2.5 py-1.5 text-left text-[0.9375rem] font-semibold transition-colors"
                >
                  {t('reader.followSet')}
                </button>
              </li>
            </SetlistPickRows>
          )}
        </PaneChooser>
        {right && rightIndex !== null ? (
          <SplitSong
            entry={right}
            pane="right"
            playKey={playKeyFor(rightIndex)}
            onPlayKeyChange={(key) => onPlayKeyChange(right._id, key)}
            note={noteFor(right._id)}
          />
        ) : (
          <div className="grid h-[70%] place-content-center">
            <p className="flex items-center gap-3.5 text-[clamp(1.75rem,0.9rem+1.6vw,2.625rem)] leading-[1.08] font-bold tracking-[-0.03em]">
              <span aria-hidden className="flex gap-1">
                {songs.map(({ id }) => (
                  <i key={id} className="bg-pixel-played size-2" />
                ))}
              </span>
              {t('reader.endOfSet')}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
