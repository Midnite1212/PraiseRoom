import { FileText } from 'pixelarticons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { type MusicKey, parseKey } from '@/features/chords/theory';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

import { chartChords } from './chart-chords';
import { ChordChart } from './chord-chart';
import {
  createChordSpeller,
  type SectionRepeats,
  useAccidentals,
  useChordChart,
  useChordNotation,
  useChordStyle,
  useColourChords,
  useReaderMode,
  useSectionRepeats,
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
  // Overrides the saved choice; the public setlist link always shows the full flow.
  repeats?: SectionRepeats;
  // Offers the chord chart (still subject to the saved Chord chart choice and Chords mode).
  chordChart?: boolean;
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
  repeats,
  chordChart = false,
  children,
}: SongReaderProps) {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const [mode] = useReaderMode();
  const [notation] = useChordNotation();
  const [accidentals] = useAccidentals();
  const [chordStyle] = useChordStyle();
  const [colourChords] = useColourChords();
  const [savedRepeats] = useSectionRepeats();
  const [lyricsSize] = useLyricsSize();
  const [lyricsColumns, setLyricsColumns] = useLyricsColumns();
  const originalKey = parseKey(song.originalKey);
  const showChordControls = mode === 'chords' && originalKey && playKey;
  const titleId = pane === 'right' ? 'song-title-right' : 'song-title';
  const sectionRepeats = repeats ?? savedRepeats;
  const [chartChoice, setChartChoice] = useChordChart();
  const chords =
    chordChart && mode === 'chords'
      ? chartChords(
          song.chordLyrics,
          createChordSpeller(originalKey, playKey, accidentals, chordStyle, capo)
        )
      : [];
  const offersChart = chords.length > 0;
  const showsChart = offersChart && chartChoice === 'on';

  return (
    <article
      data-lyrics-size={lyricsSize}
      aria-labelledby={titleId}
      className={cn(
        'min-w-0',
        showsChart &&
          'roomy:grid roomy:grid-cols-[minmax(0,1fr)_216px] roomy:grid-rows-[auto_1fr] roomy:gap-x-10'
      )}
    >
      <header className={cn('mb-[18px]', showsChart && 'roomy:col-start-1')}>
        <div
          className={cn(
            'flex items-start gap-0.5 text-[clamp(1.75rem,1.2rem+2.2vw,2.5rem)] leading-[1.08] font-bold tracking-[-0.03em]',
            pane
              ? 'wide:text-[clamp(1.75rem,0.9rem+1.6vw,2.625rem)]'
              : 'wide:text-[clamp(2rem,1rem+1.8vw,3rem)]'
          )}
        >
          <h1 id={titleId} data-page-title className="text-balance">
            {song.title}
          </h1>
          <span className="flex h-[1lh] flex-none items-center">
            <SongInfo song={song} />
          </span>
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

      {offersChart ? (
        <ChordChart
          chords={chords}
          open={showsChart}
          onOpenChange={(open) => setChartChoice(open ? 'on' : 'off')}
          className={cn(showsChart && 'roomy:col-start-2 roomy:row-span-2 roomy:row-start-1')}
        />
      ) : null}

      <div className={cn('min-w-0', showsChart && 'roomy:col-start-1 roomy:row-start-2')}>
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
            repeats={sectionRepeats}
          />
        )}

        {children}
      </div>
    </article>
  );
}
