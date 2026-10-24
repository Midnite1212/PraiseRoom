import { describe, expect, it } from 'vitest';

import { conventionalKey, shapeKey, signedSemitones } from './key-spelling';
import { keyLabel } from './theory';

describe('conventionalKey', () => {
  it('spells each tonic the way musicians expect', () => {
    expect(Array.from({ length: 12 }, (_, root) => keyLabel(conventionalKey(root, false)))).toEqual(
      ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    );
    expect(Array.from({ length: 12 }, (_, root) => keyLabel(conventionalKey(root, true)))).toEqual([
      'Cm',
      'C#m',
      'Dm',
      'Ebm',
      'Em',
      'Fm',
      'F#m',
      'Gm',
      'G#m',
      'Am',
      'Bbm',
      'Bm',
    ]);
  });
});

describe('signedSemitones', () => {
  it('returns the shortest signed distance', () => {
    expect(signedSemitones(conventionalKey(7, false), conventionalKey(9, false))).toBe(2);
    expect(signedSemitones(conventionalKey(7, false), conventionalKey(5, false))).toBe(-2);
    expect(signedSemitones(conventionalKey(0, false), conventionalKey(6, false))).toBe(6);
  });
});

describe('shapeKey', () => {
  it('is the play key itself with no capo', () => {
    const playKey = conventionalKey(10, false);
    expect(shapeKey(playKey, 0)).toBe(playKey);
  });

  it('drops the play key by the capo fret and keeps major or minor', () => {
    expect(keyLabel(shapeKey(conventionalKey(1, false), 4))).toBe('A');
    expect(keyLabel(shapeKey(conventionalKey(9, true), 2))).toBe('Gm');
  });

  it('wraps below C and spells the shape key conventionally', () => {
    expect(keyLabel(shapeKey(conventionalKey(0, false), 2))).toBe('Bb');
    expect(keyLabel(shapeKey(conventionalKey(2, false), 3))).toBe('B');
  });
});
