import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { type MusicKey, parseKey } from '@/features/chords/theory';
import { useIsWide } from '@/hooks/use-wide';

import { useChordNotation, useReaderMode } from './chord-display';
import { KeyPicker } from './key-picker';
import { useLyricsColumns } from './lyrics-columns';
import { LyricsSheet } from './lyrics-sheet';
import { useLyricsSize } from './lyrics-size';
import { ChordNotationToggle, LyricsColumnsControl, SongInfo } from './reader-controls';
import type { ReaderSong } from './song';

type SongReaderProps = {
  song: ReaderSong;
  playKey: MusicKey | null;
  onPlayKeyChange: (key: MusicKey) => void;
  children?: ReactNode;
};

// The reading sheet shared by the song view, the setlist view, and the public setlist view: the title
// with ⓘ, the artist with the song's key and lyric columns, then the lyrics. On phones the key lives in
// the dock and the notation toggle takes its place here.
export function SongReader({ song, playKey, onPlayKeyChange, children }: SongReaderProps) {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const [mode] = useReaderMode();
  const [notation, setNotation] = useChordNotation();
  const [lyricsSize] = useLyricsSize();
  const [lyricsColumns, setLyricsColumns] = useLyricsColumns();
  const originalKey = parseKey(song.originalKey);
  const showChordControls = mode === 'chords' && originalKey && playKey;

  return (
    <article data-lyrics-size={lyricsSize} aria-labelledby="song-title" className="min-w-0">
      <header className="mb-[18px]">
        <div className="flex items-start gap-0.5">
          <h1
            id="song-title"
            data-page-title
            className="wide:text-[clamp(2rem,1rem+1.8vw,3rem)] text-[clamp(1.75rem,1.2rem+2.2vw,2.5rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance"
          >
            {song.title}
          </h1>
          <SongInfo song={song} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-ink-2 min-w-0">{song.artist}</span>
          <div className="flex items-center gap-1.5">
            {showChordControls ? (
              isWide ? (
                <KeyPicker originalKey={originalKey} playKey={playKey} onChange={onPlayKeyChange} />
              ) : (
                <ChordNotationToggle notation={notation} onChange={setNotation} />
              )
            ) : null}
            <LyricsColumnsControl columns={lyricsColumns} onChange={setLyricsColumns} />
          </div>
        </div>
      </header>

      {song.chordLyrics.trim() === '' ? (
        <p className="text-ink-2">{t('reader.noLyrics')}</p>
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
