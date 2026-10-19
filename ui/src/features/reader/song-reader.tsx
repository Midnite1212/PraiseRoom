import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { type MusicKey, parseKey } from '@/features/chords/theory';
import { cn } from '@/lib/utils';

import { useChordNotation, useReaderMode } from './chord-display';
import { KeyPicker } from './key-picker';
import { useLyricsColumns } from './lyrics-columns';
import { LyricsSheet } from './lyrics-sheet';
import { useLyricsSize } from './lyrics-size';
import {
  ChordNotationToggle,
  LyricsColumnsControl,
  LyricsSizeControl,
  ReaderModeToggle,
  SongInfo,
} from './reader-controls';
import type { ReaderSong } from './song';
import { useScrolledPast } from './use-scrolled-past';

// `app` sits under the 56px app header (`top-14`); `page` is for layouts without one.
const STICKY_OFFSETS = {
  app: { px: 56, className: 'top-14' },
  page: { px: 0, className: 'top-0' },
} as const;

type SongReaderProps = {
  song: ReaderSong;
  playKey: MusicKey | null;
  onPlayKeyChange: (key: MusicKey) => void;
  stickyUnder?: keyof typeof STICKY_OFFSETS;
  children?: ReactNode;
};

// The reading sheet shared by the musician view, the song view, and the public setlist view:
// sticky row, header with chord controls, and the lyrics. Reader preferences come from storage.
export function SongReader({
  song,
  playKey,
  onPlayKeyChange,
  stickyUnder = 'app',
  children,
}: SongReaderProps) {
  const { t } = useTranslation();
  const [mode] = useReaderMode();
  const [notation, setNotation] = useChordNotation();
  const [lyricsSize] = useLyricsSize();
  const [lyricsColumns] = useLyricsColumns();
  const sticky = STICKY_OFFSETS[stickyUnder];
  const [headerRef, isHeaderScrolledPast] = useScrolledPast(sticky.px);
  const originalKey = parseKey(song.originalKey);

  const chordControls: ReactNode =
    mode === 'chords' && originalKey && playKey ? (
      <>
        <KeyPicker originalKey={originalKey} playKey={playKey} onChange={onPlayKeyChange} />
        <ChordNotationToggle notation={notation} onChange={setNotation} />
      </>
    ) : null;

  return (
    <article
      data-lyrics-size={lyricsSize}
      aria-labelledby="song-title"
      className="bg-sheet text-sheet-foreground min-w-0 flex-1 rounded-xl border px-5 py-5 md:px-8 md:py-6"
    >
      {isHeaderScrolledPast ? (
        <div
          className={cn(
            'sticky z-10 -mx-5 mb-4 flex items-center gap-3 border-b bg-sheet/95 px-5 py-2 backdrop-blur md:-mx-8 md:px-8',
            sticky.className
          )}
        >
          <p className="min-w-0 flex-1 truncate font-semibold">{song.title}</p>
          <SongInfo song={song} />
          <div className="flex shrink-0 items-center gap-1.5">{chordControls}</div>
        </div>
      ) : null}

      <header
        ref={headerRef}
        className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3"
      >
        <div className="max-w-2xl min-w-0">
          <div className="flex items-start gap-1">
            <h1
              id="song-title"
              className="text-xl leading-tight font-semibold text-balance md:text-2xl"
            >
              {song.title}
            </h1>
            <SongInfo song={song} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{song.artist}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">{chordControls}</div>
      </header>

      {song.chordLyrics.trim() === '' ? (
        <p className="text-muted-foreground">{t('reader.noLyrics')}</p>
      ) : (
        <LyricsSheet
          chordLyrics={song.chordLyrics}
          mode={mode}
          notation={notation}
          originalKey={originalKey}
          playKey={playKey}
          columns={lyricsColumns}
        />
      )}

      {children}
    </article>
  );
}

// Lyrics/Chords and lyrics size, for the page toolbar around a SongReader.
export function ReaderPreferenceControls() {
  const [mode, setMode] = useReaderMode();
  const [lyricsSize, setLyricsSize] = useLyricsSize();
  const [lyricsColumns, setLyricsColumns] = useLyricsColumns();
  return (
    <>
      <ReaderModeToggle mode={mode} onChange={setMode} />
      <LyricsColumnsControl columns={lyricsColumns} onChange={setLyricsColumns} />
      <LyricsSizeControl size={lyricsSize} onChange={setLyricsSize} />
    </>
  );
}
