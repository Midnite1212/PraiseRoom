import { describe, expect, it } from 'vitest';

import { conventionalKey } from '@/features/chords/key-spelling';
import { keyLabel } from '@/features/chords/theory';

import { keyForShortcut } from './key-shortcut';

type Tonic = [root: number, isMinor: boolean];

const label = (pressed: string, original: Tonic, play: Tonic) => {
  const next = keyForShortcut(pressed, conventionalKey(...original), conventionalKey(...play));
  return next ? keyLabel(next) : null;
};

const G_MAJOR: Tonic = [7, false];
const B_MINOR: Tonic = [11, true];

describe('keyForShortcut', () => {
  it('jumps to the pressed tonic in a major song', () => {
    expect(label('d', G_MAJOR, G_MAJOR)).toBe('D');
    expect(label('A', G_MAJOR, G_MAJOR)).toBe('A');
  });

  it('keeps a minor song minor', () => {
    expect(label('e', B_MINOR, B_MINOR)).toBe('Em');
    expect(label('f', B_MINOR, B_MINOR)).toBe('Fm');
  });

  it('moves a semitone from the key being played', () => {
    expect(label('+', G_MAJOR, [9, false])).toBe('Bb');
    expect(label('=', G_MAJOR, [9, false])).toBe('Bb');
    expect(label('-', G_MAJOR, [9, false])).toBe('Ab');
  });

  it('wraps around the octave and stays minor', () => {
    expect(label('+', B_MINOR, B_MINOR)).toBe('Cm');
    expect(label('-', [0, true], [0, true])).toBe('Bm');
  });

  it('ignores every other key', () => {
    for (const pressed of ['h', 'z', '1', 'Enter', 'ArrowRight', ' ', '#', 'Shift']) {
      expect(label(pressed, G_MAJOR, G_MAJOR)).toBeNull();
    }
  });
});
