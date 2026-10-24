import type { ReactNode } from 'react';

import { type ChordClass, classifyChord } from '@/features/chords/chord-class';
import { shapeKey } from '@/features/chords/key-spelling';
import { chordToNumberParts } from '@/features/chords/nashville';
import { type ChordLine, parseChordLyrics } from '@/features/chords/parse';
import {
  type MusicKey,
  semitonesBetween,
  simplifyChord,
  transposeChord,
} from '@/features/chords/theory';
import {
  type Accidentals,
  type ChordNotation,
  type ChordStyle,
  chordsUseFlats,
  type ReaderMode,
} from '@/features/reader/chord-display';
import { cn } from '@/lib/utils';

import {
  DEFAULT_LYRICS_COLUMNS,
  LYRICS_COLUMN_CLASSES,
  type LyricsColumns,
} from './lyrics-columns';

type LyricsSheetProps = {
  chordLyrics: string;
  mode: ReaderMode;
  notation: ChordNotation;
  accidentals?: Accidentals;
  chordStyle?: ChordStyle;
  colourChords?: boolean;
  originalKey: MusicKey | null;
  playKey: MusicKey | null;
  capo?: number;
  columns?: LyricsColumns;
};

export type ChordRenderer = (chord: string) => ReactNode;

const CHORD_CLASS_COLOURS: Record<ChordClass, string> = {
  one: 'text-chord',
  four: 'text-chord-four',
  five: 'text-chord-five',
  minor: 'text-chord-minor',
  other: 'text-ink-2',
};

export const createChordRenderer = (
  notation: ChordNotation,
  originalKey: MusicKey | null,
  playKey: MusicKey | null,
  accidentals: Accidentals,
  chordStyle: ChordStyle,
  capo: number
): ChordRenderer => {
  const shape = (chord: string) => (chordStyle === 'simple' ? simplifyChord(chord) : chord);
  if (notation === 'numbers' && originalKey) {
    return (chord) => {
      const parts = chordToNumberParts(shape(chord), originalKey);
      if (!parts) return chord;
      return (
        <>
          {parts.degree}
          {parts.quality ? (
            <sup className="align-[0.5em] text-[0.68em] leading-none">{parts.quality}</sup>
          ) : null}
          {parts.bass ? `/${parts.bass}` : null}
        </>
      );
    };
  }
  const semitones = originalKey && playKey ? semitonesBetween(originalKey, playKey) - capo : 0;
  const useFlats = chordsUseFlats(accidentals, playKey && shapeKey(playKey, capo));
  return (chord) => transposeChord(shape(chord), semitones, useFlats);
};

export function LyricLine({
  line,
  showChords,
  renderChord,
  colourKey,
  centered = false,
}: {
  line: ChordLine;
  showChords: boolean;
  renderChord: ChordRenderer;
  colourKey: MusicKey | null;
  centered?: boolean;
}) {
  if (line.segments.length === 0) {
    return <div className="h-[0.75em]" aria-hidden />;
  }
  const lineHasChords = line.segments.some(({ chord }) => Boolean(chord));
  if (!showChords || !lineHasChords) {
    const text = line.segments.map(({ lyric }) => lyric).join('');
    return text.trim() === '' ? null : <p className="whitespace-pre-wrap">{text}</p>;
  }
  return (
    <p className={cn('flex flex-wrap items-end', centered && 'justify-center')}>
      {line.segments.map(({ id, chord, lyric }) => (
        <span key={id} className="inline-flex max-w-full min-w-0 flex-col">
          <span
            className={cn(
              'min-h-[1.3em] pr-[0.45em] font-mono leading-[1.3] font-semibold',
              chord && colourKey
                ? CHORD_CLASS_COLOURS[classifyChord(chord, colourKey)]
                : 'text-chord'
            )}
          >
            {chord ? renderChord(chord) : null}
          </span>
          <span className="break-words whitespace-pre-wrap">{lyric === '' ? ' ' : lyric}</span>
        </span>
      ))}
    </p>
  );
}

export function LyricsSheet({
  chordLyrics,
  mode,
  notation,
  accidentals = 'auto',
  chordStyle = 'full',
  colourChords = false,
  originalKey,
  playKey,
  capo = 0,
  columns = DEFAULT_LYRICS_COLUMNS,
}: LyricsSheetProps) {
  const sections = parseChordLyrics(chordLyrics);
  const renderChord = createChordRenderer(
    notation,
    originalKey,
    playKey,
    accidentals,
    chordStyle,
    capo
  );
  const showChords = mode === 'chords';

  return (
    // Not merged with cn(): tailwind-merge reads text-lyrics (size) and text-sheet-foreground (colour)
    // as one conflicting text-* group and drops the size.
    <div
      className={`font-lyrics text-lyrics text-sheet-foreground gap-8 leading-[1.45] md:gap-14 ${LYRICS_COLUMN_CLASSES[columns]}`}
    >
      {sections.map((section) => (
        <section
          key={section.id}
          className={cn(
            'mb-[1.5em] break-inside-avoid scroll-mt-[calc(var(--top-h)+60px)]',
            showChords ? 'space-y-[0.35em]' : 'space-y-0'
          )}
        >
          {section.label ? (
            <h3 className="text-label mb-[0.55em] flex items-center gap-2 font-sans text-xs leading-none font-bold tracking-[0.12em] uppercase before:size-1.5 before:bg-current">
              {section.label}
            </h3>
          ) : null}
          {section.lines.map((line) => (
            <LyricLine
              key={line.id}
              line={line}
              showChords={showChords}
              renderChord={renderChord}
              colourKey={colourChords ? originalKey : null}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
