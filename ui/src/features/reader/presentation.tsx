import { Close } from 'pixelarticons/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { PointerEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { useAccidentals, useChordNotation, useChordStyle, useColourChords } from './chord-display';
import { leaveFullscreen } from './fullscreen';
import { createChordRenderer, LyricLine } from './lyrics-sheet';
import {
  buildSlides,
  clampSlide,
  nextUp,
  type PresentSong,
  type Slide,
  titleSlideIndex,
} from './present-slides';

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter']);
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']);
const CONTROLS_VISIBLE_MS = 2200;
const SWIPE_DISTANCE = 48;
const TAP_DISTANCE = 10;
const MAX_TEXT_PX = 72;
const MIN_TEXT_PX = 18;
const TEXT_STEP_PX = 2;
const WIDTH_SHARE = 0.042;

type PresentationProps = {
  songs: PresentSong[];
  // The song the set is on; the presentation opens at its title slide.
  startIndex: number;
  // Called with the song the presentation stopped on.
  onExit: (songIndex: number) => void;
};

const isButtonTarget = (target: EventTarget | null) =>
  target instanceof Element && target.closest('button, [role="switch"]') !== null;

// The controls fade in on any pointer activity and out again after a moment.
function useIdleVisible(): [boolean, () => void] {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hideSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), CONTROLS_VISIBLE_MS);
  };

  useEffect(() => {
    timer.current = setTimeout(() => setVisible(false), CONTROLS_VISIBLE_MS);
    return () => clearTimeout(timer.current);
  }, []);

  return [
    visible,
    () => {
      setVisible(true);
      hideSoon();
    },
  ];
}

// Shrinks a section's text until the slide fits the stage, from a share of the screen width down to a
// floor. Refits when the stage or the slide changes size (a resize, the chords switch).
function useFitText() {
  const slideRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slide = slideRef.current;
    const lines = linesRef.current;
    const stage = slide?.parentElement;
    if (!slide || !lines || !stage) return undefined;
    const fit = () => {
      let size = Math.min(window.innerWidth * WIDTH_SHARE, MAX_TEXT_PX);
      lines.style.setProperty('--p-size', `${size}px`);
      while (slide.offsetHeight > stage.clientHeight + 1 && size > MIN_TEXT_PX) {
        size -= TEXT_STEP_PX;
        lines.style.setProperty('--p-size', `${size}px`);
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    observer.observe(slide);
    return () => observer.disconnect();
  }, []);

  return { slideRef, linesRef };
}

function Pixels({ songs, current }: { songs: PresentSong[]; current: number }) {
  return (
    <span aria-hidden className="flex flex-none gap-1.5">
      {songs.map(({ id }, index) => (
        <i
          key={id}
          className={cn(
            'h-1 w-[22px]',
            index === current ? 'bg-pixel-on' : index < current ? 'bg-pixel-played' : 'bg-pixel-off'
          )}
        />
      ))}
    </span>
  );
}

function TitleSlide({
  song,
  songIndex,
  songCount,
}: {
  song: PresentSong;
  songIndex: number;
  songCount: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="animate-slide-in max-w-[min(92vw,1400px)]">
      <small className="text-ink-3 mb-[0.8em] block font-mono text-[clamp(0.875rem,1.2vw,1.25rem)]">
        {t('reader.present.songOf', { index: songIndex + 1, count: songCount })}
      </small>
      <h2 className="text-[clamp(2.5rem,6.5vw,6rem)] leading-[1.02] font-bold tracking-[-0.035em] text-balance">
        {song.title}
      </h2>
      <p className="text-ink-2 mt-[0.5em] text-[clamp(1rem,1.8vw,1.75rem)]">{song.artist}</p>
    </div>
  );
}

function SectionSlide({
  slide,
  song,
  showChords,
}: {
  slide: Extract<Slide, { kind: 'section' }>;
  song: PresentSong;
  showChords: boolean;
}) {
  const { slideRef, linesRef } = useFitText();
  const [notation] = useChordNotation();
  const [accidentals] = useAccidentals();
  const [chordStyle] = useChordStyle();
  const [colourChords] = useColourChords();
  const renderChord = createChordRenderer(
    notation,
    song.originalKey,
    song.playKey,
    accidentals,
    chordStyle,
    song.capo
  );

  return (
    <div ref={slideRef} className="animate-slide-in max-w-[min(92vw,1400px)]">
      {slide.section.label ? (
        <div className="text-label mb-[0.9em] text-[clamp(0.875rem,1.2vw,1.25rem)] font-bold tracking-[0.14em] uppercase">
          {slide.section.label}
        </div>
      ) : null}
      <div
        ref={linesRef}
        className={cn(
          'font-lyrics text-[length:var(--p-size,3rem)] leading-[1.3] font-semibold tracking-[-0.015em]',
          showChords && 'space-y-[0.35em]'
        )}
      >
        {slide.section.lines.map((line) => (
          <LyricLine
            key={line.id}
            line={line}
            showChords={showChords}
            renderChord={renderChord}
            colourKey={colourChords === 'on' ? song.originalKey : null}
            centered
          />
        ))}
      </div>
    </div>
  );
}

// Full-screen, one section at a time, for a TV or projector: a title slide per song, then a slide per
// section with the text fitted to the screen. Arrow keys, space, tap and swipe move; Esc or Exit leaves.
export function Presentation({ songs, startIndex, onExit }: PresentationProps) {
  const { t } = useTranslation();
  const slides = buildSlides(songs);
  const [index, setIndex] = useState(() => titleSlideIndex(slides, startIndex));
  const [showChords, setShowChords] = useState(false);
  const [controlsVisible, showControls] = useIdleVisible();
  const contentRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const current = slides[clampSlide(index, slides.length)];
  const songIndex = current?.songIndex ?? startIndex;
  const song = songs[songIndex];
  const step = (delta: number) => setIndex((value) => clampSlide(value + delta, slides.length));
  const exit = () => {
    void leaveFullscreen();
    onExit(songIndex);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const onButton = isButtonTarget(event.target);
      const direction = PREVIOUS_KEYS.has(event.key)
        ? -1
        : NEXT_KEYS.has(event.key) && !(onButton && (event.key === ' ' || event.key === 'Enter'))
          ? 1
          : 0;
      const handled = direction !== 0 || event.key === 'Escape' || event.key.toLowerCase() === 'c';
      if (!handled) return;
      // Capture phase: the reader behind listens for the same arrow keys to change songs.
      event.preventDefault();
      event.stopImmediatePropagation();
      if (direction !== 0) step(direction);
      else if (event.key === 'Escape') exit();
      else setShowChords((value) => !value);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  });

  useEffect(() => {
    document.documentElement.classList.add('overflow-hidden');
    return () => document.documentElement.classList.remove('overflow-hidden');
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) onExit(songIndex);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
    } else if (Math.abs(dx) < TAP_DISTANCE && Math.abs(dy) < TAP_DISTANCE) {
      step(event.clientX > window.innerWidth / 3 ? 1 : -1);
    }
  };

  if (!current || !song) return null;

  const upNext = nextUp(slides, index, songs);
  const nextText =
    upNext.kind === 'end'
      ? songs.length > 1
        ? t('reader.endOfSet')
        : t('reader.present.endOfSong')
      : upNext.kind === 'song'
        ? `${t('reader.present.nextSong')}: ${upNext.title}`
        : upNext.text === ''
          ? t('reader.present.nextLine')
          : `${t('reader.present.nextLine')}: ${upNext.text}`;
  const label = current.kind === 'section' ? current.section.label : null;
  const where = [`${songIndex + 1}/${songs.length}`, label].filter(Boolean).join(' · ');

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : exit())}>
      <DialogPortal>
        <DialogPrimitive.Content
          ref={contentRef}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            // Focus the slide, not a button, so space and enter turn the page at once.
            event.preventDefault();
            contentRef.current?.focus();
          }}
          onPointerMove={showControls}
          onPointerDown={showControls}
          className="group/present bg-ground text-ink fixed inset-0 z-[200] grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] px-[clamp(20px,4vw,64px)] py-[clamp(16px,3vh,36px)] outline-none"
        >
          <DialogTitle className="sr-only">{t('reader.present.title')}</DialogTitle>
          <div
            aria-hidden
            className="from-ground-lift pointer-events-none absolute inset-x-0 top-0 h-[50vh] bg-linear-to-b to-transparent"
          />
          <div className="text-ink-3 relative flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[clamp(0.875rem,1.1vw,1.125rem)] sm:flex-nowrap">
            <span className="min-w-0 flex-1 truncate">{song.title}</span>
            <div
              data-visible={controlsVisible ? '' : undefined}
              className="order-last flex w-full justify-center gap-2 opacity-0 transition-opacity duration-300 ease-out group-hover/present:opacity-100 focus-within:opacity-100 data-visible:opacity-100 sm:order-none sm:w-auto"
            >
              <span className="glass text-ink inline-flex h-10 items-center gap-2 px-3.5 text-sm font-semibold [--glass-r:999px]">
                {t('reader.present.showChords')}
                <Switch
                  aria-label={t('reader.present.showChords')}
                  checked={showChords}
                  onCheckedChange={setShowChords}
                />
              </span>
              <Button variant="glass" className="h-10 gap-2 px-3.5 text-sm" onClick={exit}>
                <Close />
                {t('reader.present.exit')}
              </Button>
            </div>
            <span aria-live="polite" className="min-w-0 flex-1 truncate text-right font-mono">
              {where}
            </span>
          </div>
          <div
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              swipe.current = null;
            }}
            className="relative grid min-h-0 touch-none place-items-center overflow-hidden text-center"
          >
            {current.kind === 'title' ? (
              <TitleSlide key={index} song={song} songIndex={songIndex} songCount={songs.length} />
            ) : (
              <SectionSlide key={index} slide={current} song={song} showChords={showChords} />
            )}
          </div>
          <div className="text-ink-3 relative flex min-h-11 items-center justify-between gap-4 text-[clamp(0.875rem,1.1vw,1.125rem)]">
            <span className="truncate">{nextText}</span>
            <Pixels songs={songs} current={songIndex} />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
