import { describe, expect, it } from 'vitest';

import { parseKey } from '@/features/chords/theory';

import { activeCapo, chordsUseFlats } from './chord-display';

describe('chordsUseFlats', () => {
  it('follows the play key on Auto', () => {
    expect(chordsUseFlats('auto', parseKey('Bb'))).toBe(true);
    expect(chordsUseFlats('auto', parseKey('A'))).toBe(false);
    expect(chordsUseFlats('auto', null)).toBe(false);
  });

  it('forces the spelling whatever the key', () => {
    expect(chordsUseFlats('sharp', parseKey('Bb'))).toBe(false);
    expect(chordsUseFlats('flat', parseKey('A'))).toBe(true);
    expect(chordsUseFlats('flat', null)).toBe(true);
  });
});

describe('activeCapo', () => {
  it('applies the fret only while the Guitar capo switch is on', () => {
    expect(activeCapo('on', 3)).toBe(3);
    expect(activeCapo('off', 3)).toBe(0);
  });
});
