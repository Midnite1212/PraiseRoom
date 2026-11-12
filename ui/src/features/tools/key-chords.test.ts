import { describe, expect, it } from 'vitest';

import { conventionalKey } from '@/features/chords/key-spelling';

import { buildProgression, chordsInKey, PROGRESSIONS, progressionName } from './key-chords';

const G = conventionalKey(7, false);
const B_FLAT = conventionalKey(10, false);
const E = conventionalKey(4, false);

const names = (chords: { name: string }[]) => chords.map(({ name }) => name);

describe('chordsInKey', () => {
  it('lists the seven chords of G as letters, numbers and numerals', () => {
    const chords = chordsInKey(G);
    expect(names(chords)).toEqual(['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim']);
    expect(chords.map(({ number }) => number)).toEqual(['1', '2m', '3m', '4', '5', '6m', '7dim']);
    expect(chords.map(({ roman }) => roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
  });

  it('spells a flat key with flats and a sharp key with sharps', () => {
    expect(names(chordsInKey(B_FLAT))).toEqual(['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim']);
    expect(names(chordsInKey(E))).toEqual(['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim']);
  });
});

describe('buildProgression', () => {
  it('builds each worship progression in G', () => {
    const built = PROGRESSIONS.map(({ degrees }) => names(buildProgression(G, degrees)));
    expect(built).toEqual([
      ['G', 'D', 'Em', 'C'],
      ['G', 'C', 'Em', 'D'],
      ['Am', 'D', 'G'],
    ]);
  });

  it('follows the key', () => {
    expect(names(buildProgression(B_FLAT, [1, 5, 6, 4]))).toEqual(['Bb', 'F', 'Gm', 'Eb']);
  });

  it('skips a degree outside the scale', () => {
    expect(names(buildProgression(G, [1, 8, 0, 5]))).toEqual(['G', 'D']);
  });
});

describe('progressionName', () => {
  it('names each progression by its numerals', () => {
    const built = PROGRESSIONS.map(({ degrees }) => progressionName(buildProgression(G, degrees)));
    expect(built).toEqual(['I–V–vi–IV', 'I–IV–vi–V', 'ii–V–I']);
  });
});
