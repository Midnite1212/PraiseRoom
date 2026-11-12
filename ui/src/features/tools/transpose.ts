import { type ChordNumber, chordToNumberParts } from '@/features/chords/nashville';
import { parseChordLyrics } from '@/features/chords/parse';
import {
  type MusicKey,
  parseChord,
  semitonesBetween,
  transposeChord,
} from '@/features/chords/theory';

export type ChordToken =
  | { id: string; kind: 'chord'; typed: string; chord: string }
  | { id: string; kind: 'bar' | 'unread'; typed: string };

export type ChordRow = { id: string; tokens: ChordToken[] };

export type TransposedToken =
  | { id: string; kind: 'chord'; typed: string; letters: string; number: ChordNumber | null }
  | { id: string; kind: 'bar' | 'unread'; typed: string };

export type TransposedRow = { id: string; tokens: TransposedToken[] };

export const MAX_CHORD_TEXT = 600;

const BAR_LINE = /^\|+$/;

const plainAccidentals = (text: string): string => text.replace(/♭/g, 'b').replace(/♯/g, '#');

const bracketChords = (line: string): string[] =>
  parseChordLyrics(line)
    .flatMap(({ lines }) => lines)
    .flatMap(({ segments }) => segments)
    .flatMap(({ chord }) => (chord ? [chord] : []));

const readToken = (typed: string, id: string): ChordToken => {
  if (BAR_LINE.test(typed)) return { id, kind: 'bar', typed };
  const chord = plainAccidentals(typed);
  return parseChord(chord) ? { id, kind: 'chord', typed, chord } : { id, kind: 'unread', typed };
};

// A line with `[G]` brackets gives its bracketed chords; any other line is split on spaces.
export const readChordRows = (text: string): ChordRow[] =>
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .flatMap((line, lineIndex) => {
      const typed = line.includes('[') ? bracketChords(line) : line.split(/\s+/);
      const tokens = typed
        .filter((token) => token !== '')
        .map((token, index) => readToken(token, `${lineIndex}.${index}`));
      return tokens.length > 0 ? [{ id: `${lineIndex}`, tokens }] : [];
    });

export const transposeRows = (
  rows: readonly ChordRow[],
  from: MusicKey,
  to: MusicKey,
  useFlats: boolean
): TransposedRow[] => {
  const semitones = semitonesBetween(from, to);
  return rows.map(({ id, tokens }) => ({
    id,
    tokens: tokens.map((token) =>
      token.kind === 'chord'
        ? {
            id: token.id,
            kind: 'chord',
            typed: token.typed,
            letters: transposeChord(token.chord, semitones, useFlats),
            number: chordToNumberParts(token.chord, from),
          }
        : token
    ),
  }));
};

export const hasUnread = (rows: readonly ChordRow[]): boolean =>
  rows.some(({ tokens }) => tokens.some(({ kind }) => kind === 'unread'));
