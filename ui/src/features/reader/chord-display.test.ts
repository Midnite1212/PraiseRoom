import { describe, expect, it } from 'vitest';

import { parseKey } from '@/features/chords/theory';

import { chordsUseFlats } from './chord-display';

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
