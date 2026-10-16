import { describe, expect, it } from 'vitest';

import { conventionalKey, signedSemitones } from './key-spelling';
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
