import { ChevronLeft, ChevronRight, ListMusic } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { conventionalKey } from '@/features/chords/key-spelling';
import { keyLabel, type MusicKey, parseKey } from '@/features/chords/theory';
import { ShareButton } from '@/features/reader/reader-controls';
import { ReaderPreferenceControls, SongReader } from '@/features/reader/song-reader';
import { cn } from '@/lib/utils';

import { keyForSong, type Setlist } from '../api';
import { formatSetlistDate } from '../format-date';
import { SetlistRail } from './setlist-rail';

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

type MusicianViewProps = {
  setlist: Setlist;
  songNumber: number;
  onSongChange: (songNumber: number) => void;
  variant?: 'member' | 'public';
};

export function MusicianView({
  setlist,
  songNumber,
  onSongChange,
  variant = 'member',
}: MusicianViewProps) {
  const { t, i18n } = useTranslation();
  const [chosenKeys, setChosenKeys] = useState<Record<string, number>>({});
  const [isRailOpen, setIsRailOpen] = useState(false);

  const songCount = setlist.songs.length;
  const currentIndex = Math.min(Math.max(songNumber, 1), Math.max(songCount, 1)) - 1;
  const song = setlist.songs[currentIndex];

  const goToSong = (number: number) => {
    if (number >= 1 && number <= songCount) onSongChange(number);
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

  const rail = (
    <SetlistRail
      setlist={setlist}
      currentIndex={currentIndex}
      currentKeyLabel={playKey ? keyLabel(playKey) : song.originalKey}
      onSelect={(number) => {
        setIsRailOpen(false);
        goToSong(number);
      }}
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
          <ReaderPreferenceControls />
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
        <aside
          className={cn(
            'sticky hidden max-h-[calc(100svh-6rem)] w-64 shrink-0 overflow-y-auto rounded-xl border bg-sidebar p-3 lg:block',
            variant === 'member' ? 'top-[4.5rem]' : 'top-4'
          )}
        >
          {rail}
        </aside>

        <SongReader
          key={song._id}
          song={song}
          playKey={playKey}
          onPlayKeyChange={(key) => setChosenKeys((keys) => ({ ...keys, [song._id]: key.root }))}
          stickyUnder={variant === 'member' ? 'app' : 'page'}
        >
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
        </SongReader>
      </div>
    </div>
  );
}
