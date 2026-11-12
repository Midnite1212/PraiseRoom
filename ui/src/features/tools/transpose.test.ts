import { describe, expect, it } from 'vitest';

import { conventionalKey } from '@/features/chords/key-spelling';
import type { ChordNumber } from '@/features/chords/nashville';
import { noteIndex } from '@/features/chords/theory';

import { type ChordRow, hasUnread, readChordRows, transposeRows } from './transpose';

const key = (name: string) => conventionalKey(noteIndex(name) ?? 0, false);

const typedKinds = (rows: ChordRow[]) =>
  rows.map(({ tokens }) => tokens.map(({ kind, typed }) => `${kind}:${typed}`));

const numberText = (number: ChordNumber | null) =>
  number ? `${number.degree}${number.quality}${number.bass === null ? '' : `/${number.bass}`}` : '';

const move = (text: string, from: string, to: string) =>
  transposeRows(readChordRows(text), key(from), key(to), key(to).prefersFlats).map(({ tokens }) =>
    tokens.map((token) =>
      token.kind === 'chord' ? `${token.letters} ${numberText(token.number)}` : token.typed
    )
  );

describe('readChordRows', () => {
  it('splits a line of chords on spaces', () => {
    expect(typedKinds(readChordRows('G  D/F#\tEm C'))).toEqual([
      ['chord:G', 'chord:D/F#', 'chord:Em', 'chord:C'],
    ]);
  });

  it('takes the chords out of a line with brackets and drops the lyrics', () => {
    expect(
      typedKinds(readChordRows('[G]Amazing [D/F#]grace, how [Em]sweet [ C ]the sound'))
    ).toEqual([['chord:G', 'chord:D/F#', 'chord:Em', 'chord:C']]);
  });

  it('keeps each line, skips blank ones and keeps bar lines', () => {
    expect(typedKinds(readChordRows('| G | C |\r\n\n  \n[Am][F]'))).toEqual([
      ['bar:|', 'chord:G', 'bar:|', 'chord:C', 'bar:|'],
      ['chord:Am', 'chord:F'],
    ]);
  });

  it('keeps words and cues that are not chords, as typed', () => {
    const rows = readChordRows('G hello C\n[G]Sing [x2]');

    expect(typedKinds(rows)).toEqual([
      ['chord:G', 'unread:hello', 'chord:C'],
      ['chord:G', 'unread:x2'],
    ]);
    expect(hasUnread(rows)).toBe(true);
    expect(hasUnread(readChordRows('G C D'))).toBe(false);
  });

  it('reads flat and sharp signs and lowercase roots', () => {
    expect(readChordRows('B♭ F♯m7 g')[0]?.tokens).toEqual([
      { id: '0.0', kind: 'chord', typed: 'B♭', chord: 'Bb' },
      { id: '0.1', kind: 'chord', typed: 'F♯m7', chord: 'F#m7' },
      { id: '0.2', kind: 'chord', typed: 'g', chord: 'g' },
    ]);
  });

  it('reads nothing from empty text', () => {
    expect(readChordRows('')).toEqual([]);
    expect(readChordRows(' \n\t')).toEqual([]);
  });
});

describe('transposeRows', () => {
  it('moves chords to the new key with their numbers, keeping the slash bass', () => {
    expect(move('G D/F# Em C', 'G', 'A')).toEqual([['A 1', 'E/G# 5/7', 'F#m 6m', 'D 4']]);
  });

  it('keeps minors, sevenths and other qualities', () => {
    expect(move('Am7 Dm7 G7 Cmaj7 Fsus4 Gadd9', 'C', 'D')).toEqual([
      ['Bm7 6m7', 'Em7 2m7', 'A7 57', 'Dmaj7 1maj7', 'Gsus4 4sus4', 'Aadd9 5add9'],
    ]);
  });

  it('spells flats in flat keys and sharps in sharp keys', () => {
    expect(move('G C D/F#', 'G', 'F')).toEqual([['F 1', 'Bb 4', 'C/E 5/7']]);
    expect(move('C E7 A#m', 'C', 'Eb')).toEqual([['Eb 1', 'G7 37', 'Dbm b7m']]);
    expect(move('C E7 Bbm', 'C', 'E')).toEqual([['E 1', 'G#7 37', 'Dm b7m']]);
    expect(move('F Bb C', 'F', 'B')).toEqual([['B 1', 'E 4', 'F# 5']]);
  });

  it('writes a chord typed with a lowercase root or a flat sign in the app’s spelling', () => {
    expect(move('g B♭', 'G', 'F')).toEqual([['F 1', 'Ab b3']]);
  });

  it('keeps bar lines and unread words where they were', () => {
    expect(move('| G hello | D', 'G', 'A')).toEqual([['|', 'A 1', 'hello', '|', 'E 5']]);
  });

  it('numbers chords from the key they were typed in', () => {
    expect(move('E B C#m A', 'E', 'G')).toEqual([['G 1', 'D 5', 'Em 6m', 'C 4']]);
  });
});
