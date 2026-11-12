import { describe, expect, it } from 'vitest';

import { parseKey } from '@/features/chords/theory';

import { chartChords } from './chart-chords';
import { createChordSpeller } from './chord-display';

const CHART =
  '{Verse}\n[G]Sing a [D/F#]song [Em]of [C]praise\n[G]Sing [x2]\n{Chorus}\n[C]Lift [G7]up [D]high';

describe('chartChords', () => {
  it('lists each chord once, in order of first appearance, without cues', () => {
    expect(chartChords(CHART, (chord) => chord)).toEqual(['G', 'D/F#', 'Em', 'C', 'G7', 'D']);
  });

  it('spells chords the way the reader shows them after key, capo and style', () => {
    const spell = createChordSpeller(parseKey('G'), parseKey('A'), 'auto', 'simple', 2);
    expect(chartChords(CHART, spell)).toEqual(['G', 'D', 'Em', 'C']);
  });

  it('follows the play key and spelling', () => {
    const spell = createChordSpeller(parseKey('G'), parseKey('Ab'), 'auto', 'full', 0);
    expect(chartChords(CHART, spell)).toEqual(['Ab', 'Eb/G', 'Fm', 'Db', 'Ab7', 'Eb']);
  });

  it('is empty for a song without chords', () => {
    expect(chartChords('Just lyrics\n[x2]', (chord) => chord)).toEqual([]);
  });
});
