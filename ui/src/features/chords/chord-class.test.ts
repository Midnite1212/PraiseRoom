import { describe, expect, it } from 'vitest';

import { classifyChord } from './chord-class';
import { parseKey } from './theory';

const G = parseKey('G');
const A_MINOR = parseKey('Am');

const classOf = (chord: string, key = G) => {
  if (!key) throw new Error('key did not parse');
  return classifyChord(chord, key);
};

describe('classifyChord', () => {
  it('sorts the chords of a major key by degree', () => {
    expect(classOf('G')).toBe('one');
    expect(classOf('C')).toBe('four');
    expect(classOf('D')).toBe('five');
    expect(classOf('Am')).toBe('minor');
    expect(classOf('Bm')).toBe('minor');
    expect(classOf('Em')).toBe('minor');
    expect(classOf('F')).toBe('other');
    expect(classOf('Ab')).toBe('other');
  });

  it('ignores quality, extensions and the slash bass', () => {
    expect(classOf('Gsus4')).toBe('one');
    expect(classOf('Cmaj7')).toBe('four');
    expect(classOf('D7/F#')).toBe('five');
    expect(classOf('Em7')).toBe('minor');
    expect(classOf('G/B')).toBe('one');
  });

  it('reads flats and sharps as the same root', () => {
    expect(classOf('Eb', parseKey('Ab'))).toBe('five');
    expect(classOf('D#', parseKey('Ab'))).toBe('five');
    expect(classOf('Bb', parseKey('F'))).toBe('four');
    expect(classOf('A#', parseKey('F'))).toBe('four');
  });

  it('measures from the tonic of a minor key', () => {
    expect(classOf('Am', A_MINOR)).toBe('one');
    expect(classOf('Dm', A_MINOR)).toBe('four');
    expect(classOf('Em', A_MINOR)).toBe('five');
    expect(classOf('G', A_MINOR)).toBe('other');
  });

  it('files anything that is not a chord under other', () => {
    expect(classOf('N.C.')).toBe('other');
    expect(classOf('')).toBe('other');
  });
});
