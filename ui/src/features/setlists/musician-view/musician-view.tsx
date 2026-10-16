import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, ListMusic } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { conventionalKey } from '@/features/chords/key-spelling';
import { keyLabel, type MusicKey, parseKey } from '@/features/chords/theory';
import {
  type ChordNotation,
  type ReaderMode,
  useChordNotation,
  useReaderMode,
} from '@/features/reader/chord-display';
import { useLyricsSize } from '@/features/reader/lyrics-size';
import { cn } from '@/lib/utils';

import { keyForSong, type Setlist, type SetlistSong } from '../api';
import { formatSetlistDate } from '../format-date';
import { KeyPicker } from './key-picker';
import { LyricsSheet } from './lyrics-sheet';
import {
  ChordNotationToggle,
  LyricsSizeControl,
  ReaderModeToggle,
  ShareButton,
  SongInfo,
} from './reader-controls';
import { SetlistRail } from './setlist-rail';
import { useScrolledPast } from './use-scrolled-past';

const APP_HEADER_PX = 56;

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

type MusicianViewProps = { setlist: Setlist; songNumber: number };

export function MusicianView({ setlist, songNumber }: MusicianViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate({ from: '/setlists/$setlistId' });
  const [mode, setMode] = useReaderMode();
  const [notation, setNotation] = useChordNotation();
  const [lyricsSize, setLyricsSize] = useLyricsSize();
  const [chosenKeys, setChosenKeys] = useState<Record<string, number>>({});
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [headerRef, isHeaderScrolledPast] = useScrolledPast(APP_HEADER_PX);

  const songCount = setlist.songs.length;
  const currentIndex = Math.min(Math.max(songNumber, 1), Math.max(songCount, 1)) - 1;
  const song = setlist.songs[currentIndex];

  const goToSong = (number: number) => {
    if (number < 1 || number > songCount) return;
    void navigate({ search: { song: number }, replace: true });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      if (event.key === 'ArrowRight') goToSong(currentIndex + 2);
      if (event.key === 'ArrowLeft') goToSong(currentIndex);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const date = formatSetlistDate(setlist.date, i18n.language);

  if (!song) {
    return (
      <div className="bg-sheet text-muted-foreground mx-auto max-w-xl rounded-xl border p-8 text-center">
        {t('reader.emptySetlist')}
      </div>
    );
  }

  const originalKey = parseKey(song.originalKey);
  const setlistKey = parseKey(keyForSong(setlist, song)) ?? originalKey;
  const chosenRoot = chosenKeys[song._id];
  const playKey: MusicKey | null =
    chosenRoot !== undefined && originalKey
      ? conventionalKey(chosenRoot, originalKey.isMinor)
      : setlistKey;
  const playKeyLabel = playKey ? keyLabel(playKey) : song.originalKey;

  const chordControls: ReactNode =
    mode === 'chords' && originalKey && playKey ? (
      <>
        <KeyPicker
          originalKey={originalKey}
          playKey={playKey}
          onChange={(key) => setChosenKeys((keys) => ({ ...keys, [song._id]: key.root }))}
        />
        <ChordNotationToggle notation={notation} onChange={setNotation} />
      </>
    ) : null;

  const rail = (
    <SetlistRail
      setlist={setlist}
      currentIndex={currentIndex}
      currentKeyLabel={playKeyLabel}
      onNavigate={() => setIsRailOpen(false)}
    />
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Sheet open={isRailOpen} onOpenChange={setIsRailOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <ListMusic />
              {currentIndex + 1}/{songCount}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-sidebar w-80 p-3">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('reader.setlist')}</SheetTitle>
            </SheetHeader>
            {rail}
          </SheetContent>
        </Sheet>
        <p className="text-label min-w-0 flex-1 truncate font-mono text-xs tracking-[0.12em] uppercase">
          {setlist.name}
          {date ? <span className="text-muted-foreground"> · {date}</span> : null}
        </p>
        <div className="flex items-center gap-1.5">
          <ReaderModeToggle mode={mode} onChange={setMode} />
          <LyricsSizeControl size={lyricsSize} onChange={setLyricsSize} />
          <ShareButton link={setlist.publicLink} />
        </div>
        <ol className="flex w-full gap-1" aria-label={t('reader.progress')}>
          {setlist.songs.map((entry, index) => (
            <li
              key={entry._id}
              className={cn(
                'h-0.5 flex-1 rounded-full',
                index === currentIndex ? 'bg-primary' : 'bg-border'
              )}
            />
          ))}
        </ol>
      </div>

      <div className="flex items-start gap-4">
        <aside className="bg-sidebar sticky top-[4.5rem] hidden max-h-[calc(100svh-6rem)] w-64 shrink-0 overflow-y-auto rounded-xl border p-3 lg:block">
          {rail}
        </aside>

        <article
          data-lyrics-size={lyricsSize}
          aria-labelledby="song-title"
          className="bg-sheet text-sheet-foreground min-w-0 flex-1 rounded-xl border px-5 py-5 md:px-8 md:py-6"
        >
          {isHeaderScrolledPast ? (
            <div className="bg-sheet/95 sticky top-14 z-10 -mx-5 mb-4 flex items-center gap-3 border-b px-5 py-2 backdrop-blur md:-mx-8 md:px-8">
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

          <SongBody
            song={song}
            mode={mode}
            notation={notation}
            originalKey={originalKey}
            playKey={playKey}
          />

          <nav
            className="mt-8 flex items-center justify-between gap-2 border-t pt-4"
            aria-label={t('reader.changeSongs')}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => goToSong(currentIndex)}
            >
              <ChevronLeft />
              {t('reader.previous')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex >= songCount - 1}
              onClick={() => goToSong(currentIndex + 2)}
            >
              {t('reader.next')}
              <ChevronRight />
            </Button>
          </nav>
        </article>
      </div>
    </div>
  );
}

function SongBody({
  song,
  mode,
  notation,
  originalKey,
  playKey,
}: {
  song: SetlistSong;
  mode: ReaderMode;
  notation: ChordNotation;
  originalKey: MusicKey | null;
  playKey: MusicKey | null;
}) {
  const { t } = useTranslation();
  if (song.chordLyrics.trim() === '') {
    return <p className="text-muted-foreground">{t('reader.noLyrics')}</p>;
  }
  return (
    <LyricsSheet
      chordLyrics={song.chordLyrics}
      mode={mode}
      notation={notation}
      originalKey={originalKey}
      playKey={playKey}
    />
  );
}
