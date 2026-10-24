import { FileText } from 'pixelarticons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { type MusicKey, parseKey } from '@/features/chords/theory';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

import {
  useAccidentals,
  useChordNotation,
  useChordStyle,
  useColourChords,
  useReaderMode,
} from './chord-display';
import { KeyPicker } from './key-picker';
import { useLyricsColumns } from './lyrics-columns';
import { LyricsSheet } from './lyrics-sheet';
import { useLyricsSize } from './lyrics-size';
import { LyricsColumnsControl, SongInfo } from './reader-controls';
import type { ReaderSong } from './song';

type SongReaderProps = {
  song: ReaderSong;
  playKey: MusicKey | null;
  onPlayKeyChange: (key: MusicKey) => void;
  capo?: number;
  onCapoChange?: (capo: number | null) => void;
  // The setlist's note on this song; shown under the artist in Chords mode only.
  note?: string;
  // A pane of the split reader: a smaller title, and the id another pane's title does not share.
  pane?: 'left' | 'right';
  children?: ReactNode;
};

// The reading sheet shared by the song view, the setlist view, and the public setlist view: the title
// with ⓘ, the artist with the song's key (wide screens) and lyric columns, then the lyrics.
export function SongReader({
  song,
  playKey,
  onPlayKeyChange,
  capo = 0,
  onCapoChange,
  note = '',
  pane,
  children,
}: SongReaderProps) {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const [mode] = useReaderMode();
  const [notation] = useChordNotation();
  const [accidentals] = useAccidentals();
  const [chordStyle] = useChordStyle();
  const [colourChords] = useColourChords();
  const [lyricsSize] = useLyricsSize();
  const [lyricsColumns, setLyricsColumns] = useLyricsColumns();
  const originalKey = parseKey(song.originalKey);
  const showChordControls = mode === 'chords' && originalKey && playKey;
  const titleId = pane === 'right' ? 'song-title-right' : 'song-title';

  return (
    <article data-lyrics-size={lyricsSize} aria-labelledby={titleId} className="min-w-0">
      <header className="mb-[18px]">
        <div className="flex items-start gap-0.5">
          <h1
            id={titleId}
            data-page-title
            className={cn(
              'text-[clamp(1.75rem,1.2rem+2.2vw,2.5rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance',
              pane
                ? 'wide:text-[clamp(1.75rem,0.9rem+1.6vw,2.625rem)]'
                : 'wide:text-[clamp(2rem,1rem+1.8vw,3rem)]'
            )}
          >
            {song.title}
          </h1>
          <SongInfo song={song} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-ink-2 min-w-0">{song.artist}</span>
          <div className="flex items-center gap-1.5">
            {showChordControls && isWide ? (
              <KeyPicker
                originalKey={originalKey}
                playKey={playKey}
                onChange={onPlayKeyChange}
                capo={capo}
                onCapoChange={onCapoChange}
              />
            ) : null}
            <LyricsColumnsControl columns={lyricsColumns} onChange={setLyricsColumns} />
          </div>
        </div>
        {mode === 'chords' && note !== '' ? (
          <p className="bg-fill-hover text-ink-2 mt-3 inline-flex items-center gap-2 rounded-xl py-1.5 pr-3 pl-2.5 text-[0.8125rem] font-semibold">
            <FileText className="text-chord size-icon flex-none" />
            {note}
          </p>
        ) : null}
      </header>

      {song.chordLyrics.trim() === '' ? (
        <p className="text-ink-2">{t('reader.noLyrics')}</p>
      ) : (
        <LyricsSheet
          chordLyrics={song.chordLyrics}
          mode={mode}
          notation={notation}
          accidentals={accidentals}
          chordStyle={chordStyle}
          colourChords={colourChords === 'on'}
          originalKey={originalKey}
          playKey={playKey}
          capo={capo}
          columns={lyricsColumns}
        />
      )}

      {children}
    </article>
  );
}
