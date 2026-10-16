import { describe, expect, it } from 'vitest';

import { chordToNumber, chordToNumberParts } from './nashville';
import { parseKey, type MusicKey } from './theory';

const key = (name: string): MusicKey => {
  const parsed = parseKey(name);
  if (!parsed) throw new Error(`bad key ${name}`);
  return parsed;
};

describe('chordToNumber', () => {
  it.each([
    ['G', 'G', '1'],
    ['C', 'G', '4'],
    ['D', 'G', '5'],
    ['Em', 'G', '6m'],
    ['Em7', 'G', '6m7'],
    ['D/F#', 'G', '5/7'],
    ['Bb', 'G', 'b3'],
    ['F', 'G', 'b7'],
    ['Cmaj7', 'G', '4maj7'],
    ['Dsus4', 'G', '5sus4'],
    ['Am', 'Am', '1m'],
    ['C', 'Am', '3'],
    ['G', 'Am', '7'],
    ['x2', 'G', 'x2'],
  ])('numbers %p in %p as %p', (chord, inKey, expected) => {
    expect(chordToNumber(chord, key(inKey))).toBe(expected);
  });
});

describe('chordToNumberParts', () => {
  it('keeps minor on the degree and returns extensions separately', () => {
    expect(chordToNumberParts('E7', key('Am'))).toEqual({ degree: '5', quality: '7', bass: null });
    expect(chordToNumberParts('Em7/D', key('G'))).toEqual({
      degree: '6m',
      quality: '7',
      bass: '5',
    });
    expect(chordToNumberParts('x2', key('G'))).toBeNull();
  });
});
