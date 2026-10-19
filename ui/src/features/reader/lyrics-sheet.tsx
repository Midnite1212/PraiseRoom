import type { ReactNode } from 'react';

import { chordToNumberParts } from '@/features/chords/nashville';
import { type ChordLine, parseChordLyrics } from '@/features/chords/parse';
import { type MusicKey, semitonesBetween, transposeChord } from '@/features/chords/theory';
import type { ChordNotation, ReaderMode } from '@/features/reader/chord-display';
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
  originalKey: MusicKey | null;
  playKey: MusicKey | null;
  columns?: LyricsColumns;
};

type ChordRenderer = (chord: string) => ReactNode;

const createChordRenderer = (
  notation: ChordNotation,
  originalKey: MusicKey | null,
  playKey: MusicKey | null
): ChordRenderer => {
  if (notation === 'numbers' && originalKey) {
    return (chord) => {
      const parts = chordToNumberParts(chord, originalKey);
      if (!parts) return chord;
      return (
        <>
          {parts.degree}
          {parts.quality ? <sup className="text-[0.7em]">{parts.quality}</sup> : null}
          {parts.bass ? `/${parts.bass}` : null}
        </>
      );
    };
  }
  const semitones = originalKey && playKey ? semitonesBetween(originalKey, playKey) : 0;
  const useFlats = playKey?.prefersFlats ?? false;
  return (chord) => transposeChord(chord, semitones, useFlats);
};

function LyricLine({
  line,
  showChords,
  renderChord,
}: {
  line: ChordLine;
  showChords: boolean;
  renderChord: ChordRenderer;
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
    <p className="flex flex-wrap items-end">
      {line.segments.map(({ id, chord, lyric }) => (
        <span key={id} className="inline-flex flex-col">
          <span className="text-chord min-h-[1.25em] pr-[0.35em] leading-tight font-medium">
            {chord ? renderChord(chord) : null}
          </span>
          <span className="whitespace-pre">{lyric === '' ? ' ' : lyric}</span>
        </span>
      ))}
    </p>
  );
}

export function LyricsSheet({
  chordLyrics,
  mode,
  notation,
  originalKey,
  playKey,
  columns = DEFAULT_LYRICS_COLUMNS,
}: LyricsSheetProps) {
  const sections = parseChordLyrics(chordLyrics);
  const renderChord = createChordRenderer(notation, originalKey, playKey);
  const showChords = mode === 'chords';

  return (
    // Not merged with cn(): tailwind-merge reads text-lyrics (size) and text-sheet-foreground (colour)
    // as one conflicting text-* group and drops the size.
    <div
      className={`font-lyrics text-lyrics text-sheet-foreground gap-12 leading-snug ${LYRICS_COLUMN_CLASSES[columns]}`}
    >
      {sections.map((section) => (
        <section
          key={section.id}
          className={cn('mb-6 break-inside-avoid', showChords ? 'space-y-1.5' : 'space-y-0.5')}
        >
          {section.label ? (
            <h3 className="text-label mb-2 font-mono text-xs font-medium tracking-[0.14em] uppercase">
              {section.label}
            </h3>
          ) : null}
          {section.lines.map((line) => (
            <LyricLine
              key={line.id}
              line={line}
              showChords={showChords}
              renderChord={renderChord}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
