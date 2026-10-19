import { describe, expect, it } from 'vitest';

import {
  keyLabel,
  noteIndex,
  parseChord,
  parseKey,
  semitonesBetween,
  transposeChord,
  transposeChordLyrics,
  transposeKey,
} from './theory';

describe('noteIndex', () => {
  it.each([
    ['C', 0],
    ['c#', 1],
    ['Db', 1],
    ['Bb', 10],
    ['Cb', 11],
    ['E#', 5],
    ['H', null],
  ])('maps %p to %p', (note, index) => {
    expect(noteIndex(note)).toBe(index);
  });
});

describe('parseChord', () => {
  it('splits root, quality, and bass', () => {
    expect(parseChord('F#m7b5/C')).toEqual({ root: 6, quality: 'm7b5', bass: 0 });
    expect(parseChord('Gsus4')).toEqual({ root: 7, quality: 'sus4', bass: null });
  });

  it('rejects text that is not a chord', () => {
    expect(parseChord('x2')).toBeNull();
    expect(parseChord('Chorus')).toBeNull();
    expect(parseChord('C/H')).toBeNull();
  });
});

describe('transposeChord', () => {
  it.each([
    ['G', 2, false, 'A'],
    ['Em7', 3, true, 'Gm7'],
    ['D/F#', 2, false, 'E/G#'],
    ['Bb', 1, false, 'B'],
    ['A', 1, true, 'Bb'],
    ['C', -1, false, 'B'],
    ['x2', 5, false, 'x2'],
  ])('moves %p by %p semitones (flats: %p) to %p', (chord, semitones, flats, expected) => {
    expect(transposeChord(chord, semitones, flats)).toBe(expected);
  });
});

describe('keys', () => {
  it('parses major and minor keys and labels them', () => {
    const eMinor = parseKey('Em');
    expect(eMinor).toEqual({ root: 4, isMinor: true, prefersFlats: false });
    expect(eMinor && keyLabel(eMinor)).toBe('Em');
    expect(parseKey('Bb')).toEqual({ root: 10, isMinor: false, prefersFlats: true });
    expect(parseKey('E minor')).toBeNull();
    expect(parseKey(null)).toBeNull();
  });

  it('transposes keys and measures the distance between them', () => {
    const g = parseKey('G');
    const a = parseKey('A');
    expect(g && a && semitonesBetween(g, a)).toBe(2);
    expect(a && g && semitonesBetween(a, g)).toBe(10);
    const raised = g && transposeKey(g, 3, true);
    expect(raised && keyLabel(raised)).toBe('Bb');
  });
});

describe('transposeChordLyrics', () => {
  it('transposes chord tokens and leaves section labels and lyrics untouched', () => {
    const chart = '{Verse 1}\n[G]Amazing [D]grace, how [Em]sweet the [C]sound';
    expect(transposeChordLyrics(chart, 2, false)).toBe(
      '{Verse 1}\n[A]Amazing [E]grace, how [F#m]sweet the [D]sound'
    );
  });

  it('leaves unparseable bracketed cues untouched', () => {
    expect(transposeChordLyrics('[G][x2]', 2, false)).toBe('[A][x2]');
  });

  it('respells with flats when asked, even with no shift', () => {
    expect(transposeChordLyrics('[G#]', 0, true)).toBe('[Ab]');
  });
});
