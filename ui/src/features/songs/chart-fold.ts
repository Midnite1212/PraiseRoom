import type { ClipboardEvent } from 'react';

import { parseChord } from '@/features/chords/theory';

const BAR_CHARACTERS = /[()|]/g;
const NOISE_TOKEN = /^(-+|x\d+|\d+x|\/|\.|n\.?c\.?)$/i;
const BRACKETED_LINE = /^\s*\[([^\]]+)\]\s*:?\s*$/;

const isChord = (token: string) => parseChord(token) !== null;

// A line of only chords (plus bar lines, "x2", "N.C."), with at least one real chord.
export const isChordLine = (line: string): boolean => {
  const tokens = line.replace(BAR_CHARACTERS, ' ').trim().split(/\s+/).filter(Boolean);
  return tokens.some(isChord) && tokens.every((token) => isChord(token) || NOISE_TOKEN.test(token));
};

// A `[Chorus]` line is a section name, not a chord.
const sectionHeader = (line: string): string | null => {
  const name = BRACKETED_LINE.exec(line)?.[1]?.trim();
  return name === undefined || isChord(name) ? null : name;
};

// East Asian wide characters take two columns in a monospaced chart.
const columnWidth = (character: string): number => {
  const code = character.codePointAt(0) ?? 0;
  const wide =
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x20000 && code <= 0x3fffd);
  return wide ? 2 : 1;
};

const chordsWithColumns = (chordLine: string) =>
  Array.from(chordLine.replace(BAR_CHARACTERS, ' ').matchAll(/\S+/g))
    .filter((match) => isChord(match[0]))
    .map((match) => ({ column: match.index, chord: match[0] }));

// Each chord lands on the first character at or after its column; chords past the end of the lyric
// are padded out to their column.
const mergeChordsIntoLyric = (chordLine: string, lyric: string): string => {
  const chords = chordsWithColumns(chordLine);
  const body = lyric.trimStart();
  let column = lyric.length - body.length;
  let next = 0;
  let merged = '';
  for (const character of body) {
    for (let due = chords[next]; due !== undefined && due.column <= column; due = chords[next]) {
      merged += `[${due.chord}]`;
      next++;
    }
    merged += character;
    column += columnWidth(character);
  }
  for (const { column: chordColumn, chord } of chords.slice(next)) {
    merged += `${' '.repeat(Math.max(0, chordColumn - column))}[${chord}]`;
    column = Math.max(column, chordColumn);
  }
  return merged;
};

const chordsOnly = (chordLine: string): string =>
  chordsWithColumns(chordLine)
    .map(({ chord }) => `[${chord}]`)
    .join(' ');

// Turns a chart with chords on their own line above the lyrics into inline ChordPro:
// each chord goes before the character at its column, and `[Chorus]` lines become `{Chorus}`.
export const foldChordChart = (text: string): string => {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\t/g, '    '));
  const out: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? '';
    const header = sectionHeader(line);
    if (header !== null) {
      out.push(`{${header}}`);
    } else if (isChordLine(line)) {
      const next = lines[index + 1];
      if (
        next !== undefined &&
        next.trim() !== '' &&
        !isChordLine(next) &&
        sectionHeader(next) === null
      ) {
        out.push(mergeChordsIntoLyric(line, next).trimEnd());
        index++;
      } else {
        out.push(chordsOnly(line));
      }
    } else {
      out.push(line.trimEnd());
    }
  }
  return out.join('\n');
};

export type ChartPaste = { value: string; caret: number };

// The text after pasting `pasted` over `start`..`end`, with chart chords folded in, or null when the paste
// is not a chords-above-lyrics chart (a single line is left alone).
export const pasteChart = (
  value: string,
  start: number,
  end: number,
  pasted: string
): ChartPaste | null => {
  const lines = pasted.split(/\r\n?|\n/);
  if (lines.filter((line) => line.trim() !== '').length < 2 || !lines.some(isChordLine)) {
    return null;
  }
  const folded = foldChordChart(pasted);
  return { value: value.slice(0, start) + folded + value.slice(end), caret: start + folded.length };
};

// Paste handler for a lyrics textarea: folds a pasted chart into the text through `apply` and keeps the caret
// after it. Returns whether it handled the paste.
export const foldPastedChart = (
  event: ClipboardEvent<HTMLTextAreaElement>,
  apply: (value: string) => void
): boolean => {
  const area = event.currentTarget;
  const result = pasteChart(
    area.value,
    area.selectionStart,
    area.selectionEnd,
    event.clipboardData.getData('text')
  );
  if (result === null) return false;
  event.preventDefault();
  apply(result.value);
  requestAnimationFrame(() => area.setSelectionRange(result.caret, result.caret));
  return true;
};
