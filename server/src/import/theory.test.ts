import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  inferKey,
  isChord,
  normalizeKey,
  relativeMajor,
  semitonesBetween,
  transposeChart,
  transposeChord,
} from './theory';

describe('normalizeKey', () => {
  it('spells keys the way the app stores them', () => {
    const cases: Array<[string, string]> = [
      ['G', 'G'],
      ['g major', 'G'],
      ['B♭ major', 'Bb'],
      ['E minor', 'Em'],
      ['F# minor', 'F#m'],
      ['Gb', 'F#'],
      ['db', 'Db'],
      ['D#m', 'D#m'],
    ];
    for (const [raw, expected] of cases) assert.equal(normalizeKey(raw), expected, raw);
  });

  it('returns null for text that is not a key', () => {
    for (const raw of ['', 'H', 'G lydian', null, undefined]) assert.equal(normalizeKey(raw), null);
  });
});

describe('isChord', () => {
  it('accepts chord symbols and rejects lyric words', () => {
    for (const chord of ['G', 'F#m7', 'Bbmaj7', 'Dsus4', 'C/E', 'A2', 'Em7(b5)', 'Gadd9']) {
      assert.ok(isChord(chord), chord);
    }
    for (const word of ['Be', 'God', 'Almighty', 'Glory', 'x2', 'N.C.']) {
      assert.ok(!isChord(word), word);
    }
  });
});

describe('transposition', () => {
  it('moves root and bass and spells for the target key', () => {
    assert.equal(transposeChord('D/F#', 2, 'E'), 'E/G#');
    assert.equal(transposeChord('A', 1, 'Bb'), 'Bb');
    assert.equal(transposeChord('Bm7', 1, 'Eb'), 'Cm7');
  });

  it('transposes only bracketed chords in a chart', () => {
    assert.equal(
      transposeChart('{Verse 1}\n[G]Walk in the [D/F#]light [N.C.]', 2, 'A'),
      '{Verse 1}\n[A]Walk in the [E/G#]light [N.C.]'
    );
  });

  it('measures the shortest distance between keys through relative majors', () => {
    assert.equal(semitonesBetween('A', 'B'), 2);
    assert.equal(semitonesBetween('B', 'A'), -2);
    assert.equal(semitonesBetween('Em', 'F#m'), 2);
    assert.equal(semitonesBetween('Am', 'C'), 0);
    assert.equal(relativeMajor('F#m'), 'A');
  });
});

describe('inferKey', () => {
  it('finds the home key from diatonic chords', () => {
    assert.equal(inferKey('[A]one [F#m7]two [Esus]three [D2]four [A]five')?.key, 'A');
    assert.equal(inferKey('[G2]one [D]two [Asus]three [Bm7]four [D/F#]five [D]six')?.key, 'D');
  });

  it('prefers the relative minor when the chart starts and ends there', () => {
    assert.equal(inferKey('[Am]one [F]two [C]three [G]four [Am]five')?.key, 'Am');
  });

  it('does not let a IV start and end outweigh the diatonic fit', () => {
    assert.equal(
      inferKey('[C]Lord I [G]come [D]to [Em]You\n[C]Lord I [G]come [D]to [C]You')?.key,
      'G'
    );
  });

  it('needs at least three chords', () => {
    assert.equal(inferKey('[G]one [C]two'), null);
  });
});
