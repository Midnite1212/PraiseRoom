import { describe, expect, it } from 'vitest';

import { conventionalKey, shapeKey } from '@/features/chords/key-spelling';
import { ALL_KEY_ROOTS, keyLabel } from '@/features/chords/theory';

import { capoForShapes, soundingKey } from './capo';

const key = (root: number) => conventionalKey(root, false);
const B_FLAT = key(10);
const G = key(7);
const C = key(0);
const D = key(2);

describe('capoForShapes', () => {
  it('puts the capo on 3 to play G shapes in Bb', () => {
    expect(capoForShapes(B_FLAT, G)).toBe(3);
  });

  it('needs no capo when the shapes are the song key', () => {
    expect(capoForShapes(G, G)).toBe(0);
  });

  it('counts up the neck when the shapes sit above the song key', () => {
    expect(capoForShapes(C, D)).toBe(10);
    expect(capoForShapes(D, C)).toBe(2);
  });
});

describe('soundingKey', () => {
  it('hears Bb from G shapes with the capo on 3', () => {
    expect(keyLabel(soundingKey(G, 3))).toBe('Bb');
  });

  it('keeps the shapes key without a capo', () => {
    expect(soundingKey(G, 0)).toEqual(G);
  });

  it('wraps past the octave and spells the key the usual way', () => {
    expect(keyLabel(soundingKey(key(9), 4))).toBe('Db');
    expect(keyLabel(soundingKey(conventionalKey(9, true), 4))).toBe('C#m');
  });

  it('undoes shapeKey and agrees with capoForShapes for every key and fret', () => {
    for (const root of ALL_KEY_ROOTS) {
      for (let capo = 0; capo <= 11; capo += 1) {
        const heard = soundingKey(key(root), capo);
        expect(shapeKey(heard, capo).root).toBe(root);
        expect(capoForShapes(heard, key(root))).toBe(capo);
      }
    }
  });
});
