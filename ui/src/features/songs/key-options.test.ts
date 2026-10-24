import { describe, expect, it } from 'vitest';

import {
  initialKey,
  KEY_FILTER_OPTIONS,
  keyFilterSpellings,
  semitonesToKey,
  tonicOf,
} from './key-options';

const key = (label: string) => initialKey(label);

describe('key options', () => {
  it('falls back to C for a key it cannot read', () => {
    expect(initialKey('not a key')).toEqual(initialKey('C'));
    expect(initialKey('Bbm').isMinor).toBe(true);
  });

  it('measures the move between relative majors, so G to Em moves nothing', () => {
    expect(semitonesToKey(key('G'), key('Em'))).toBe(0);
    expect(semitonesToKey(key('C'), key('D'))).toBe(2);
    expect(semitonesToKey(key('Am'), key('Bm'))).toBe(2);
  });
});

describe('key filter', () => {
  it('has one option per tonic, spelled the conventional way', () => {
    expect(KEY_FILTER_OPTIONS).toHaveLength(12);
    expect(new Set(KEY_FILTER_OPTIONS.map((option) => tonicOf(option))).size).toBe(12);
  });

  it('maps a stored key to its tonic, major or minor, sharp or flat', () => {
    expect(tonicOf('D')).toBe('D');
    expect(tonicOf('Dm')).toBe('D');
    expect(tonicOf('A#')).toBe('Bb');
    expect(tonicOf('Gbm')).toBe('F#');
    expect(tonicOf('nope')).toBeNull();
  });

  it('expands a tonic to every spelling of its major and minor keys', () => {
    expect(keyFilterSpellings(['D'])).toEqual(['D', 'Dm']);
    expect(keyFilterSpellings(['Bb', 'D'])).toEqual(['A#', 'A#m', 'Bb', 'Bbm', 'D', 'Dm']);
    expect(keyFilterSpellings(['C', 'C'])).toEqual(['C', 'Cm']);
    expect(keyFilterSpellings([])).toEqual([]);
  });
});
