import guitarJson from '@tombatossals/chords-db/lib/guitar.json?raw';
import { describe, expect, it } from 'vitest';

import {
  barreSpans,
  buildChordShapeDb,
  type ChordShape,
  datasetSuffix,
  findChordShapes,
  isUnderBarre,
  shapeTab,
} from './chord-shapes';

const shape = (frets: number[], baseFret = 1, barres: number[] = []): ChordShape => ({
  frets,
  fingers: frets.map((fret) => Math.max(fret, 0)),
  baseFret,
  barres,
});

const G = shape([3, 2, 0, 0, 0, 3]);
const D = shape([-1, -1, 0, 2, 3, 2]);
const D_OVER_F_SHARP = shape([2, 0, 0, 2, 3, 2]);
const BB = shape([1, 1, 3, 3, 3, 1], 1, [1]);
const CSHARP_M7 = shape([-1, 1, 3, 1, 2, 1], 4, [1]);

const entry = (key: string, suffix: string, positions: ChordShape[]) => ({
  key,
  suffix,
  positions: positions.map((position) => ({ ...position, midi: [40] })),
});

const db = buildChordShapeDb({
  chords: {
    D: [entry('D', 'major', [D]), entry('D', '/F#', [D_OVER_F_SHARP]), entry('D', 'sus4', [D])],
    G: [
      entry('G', 'major', [G, BB]),
      entry('G', '7', [G]),
      entry('G', 'sus2', [G]),
      entry('G', 'add9', [D]),
    ],
    Bb: [entry('Bb', 'major', [BB]), entry('Bb', 'maj7', [BB]), entry('Bb', 'aug', [G])],
    Csharp: [entry('C#', 'm7', [CSHARP_M7]), entry('C#', 'dim', [D]), entry('C#', 'm7b5', [G])],
  },
});

describe('datasetSuffix', () => {
  it.each([
    ['', 'major'],
    ['m', 'minor'],
    ['min', 'minor'],
    ['min7', 'm7'],
    ['M7', 'maj7'],
    ['mM7', 'mmaj7'],
    ['m(maj7)', 'mmaj7'],
    ['7(b9)', '7b9'],
    ['2', 'sus2'],
    ['sus', 'sus4'],
    ['add2', 'add9'],
    ['+', 'aug'],
    ['°', 'dim'],
    ['°7', 'dim7'],
    ['ø7', 'm7b5'],
    ['6/9', '69'],
    ['sus4', 'sus4'],
  ])('maps %j to %j', (quality, suffix) => {
    expect(datasetSuffix(quality)).toBe(suffix);
  });
});

describe('findChordShapes', () => {
  it('finds plain chords with every voicing', () => {
    expect(findChordShapes(db, 'G')).toEqual([G, BB]);
    expect(findChordShapes(db, 'G7')).toEqual([G]);
  });

  it('reads sharps and flats as the same root', () => {
    expect(findChordShapes(db, 'Bb')).toEqual([BB]);
    expect(findChordShapes(db, 'A#')).toEqual([BB]);
    expect(findChordShapes(db, 'C#m7')).toEqual([CSHARP_M7]);
    expect(findChordShapes(db, 'Dbm7')).toEqual([CSHARP_M7]);
  });

  it('maps common spellings onto the dataset suffixes', () => {
    expect(findChordShapes(db, 'BbM7')).toEqual([BB]);
    expect(findChordShapes(db, 'Bb+')).toEqual([G]);
    expect(findChordShapes(db, 'Dsus')).toEqual([D]);
    expect(findChordShapes(db, 'G2')).toEqual([G]);
    expect(findChordShapes(db, 'Gadd9')).toEqual([D]);
    expect(findChordShapes(db, 'C#°')).toEqual([D]);
    expect(findChordShapes(db, 'Dbø7')).toEqual([G]);
  });

  it('uses a slash voicing when there is one, else the chord above the slash', () => {
    expect(findChordShapes(db, 'D/F#')).toEqual([D_OVER_F_SHARP]);
    expect(findChordShapes(db, 'D/Gb')).toEqual([D_OVER_F_SHARP]);
    expect(findChordShapes(db, 'G/B')).toEqual([G, BB]);
    expect(findChordShapes(db, 'G7/B')).toEqual([G]);
    expect(findChordShapes(db, 'Dsus4/A')).toEqual([D]);
  });

  it('returns nothing for chords without a shape and for cues', () => {
    expect(findChordShapes(db, 'G5')).toEqual([]);
    expect(findChordShapes(db, 'E')).toEqual([]);
    expect(findChordShapes(db, 'x2')).toEqual([]);
  });

  it('reads the real guitar dataset', () => {
    const real = buildChordShapeDb(JSON.parse(guitarJson));
    const chords = ['C', 'Am', 'F#m7', 'Bbmaj7', 'Esus4', 'Cadd9', 'Bdim', 'Eaug', 'C/E', 'D/F#'];
    expect(chords.filter((chord) => findChordShapes(real, chord).length === 0)).toEqual([]);
  });
});

describe('shapeTab', () => {
  it('writes muted, open and fretted strings on the neck', () => {
    expect(shapeTab(D)).toBe('x x 0 2 3 2');
    expect(shapeTab(CSHARP_M7)).toBe('x 4 6 4 5 4');
  });
});

describe('barreSpans', () => {
  it('runs a barre from the lowest to the highest string held at its fret', () => {
    const spans = barreSpans(CSHARP_M7);
    expect(spans).toEqual([{ fret: 1, from: 1, to: 5, finger: 1 }]);
    expect(isUnderBarre(spans, 3, 1)).toBe(true);
    expect(isUnderBarre(spans, 2, 3)).toBe(false);
  });

  it('ignores a barre held on one string only', () => {
    expect(barreSpans(shape([-1, 3, 2, 0, 1, 0], 1, [1]))).toEqual([]);
  });
});
