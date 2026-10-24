import { describe, expect, it } from 'vitest';

import type { ChordSegment } from '@/features/chords/parse';

import { groupWordUnits } from './word-units';

const seg = (chord: string | null, lyric: string, id = 's'): ChordSegment => ({
  id,
  chord,
  lyric,
});

const texts = (segments: ChordSegment[]) =>
  groupWordUnits(segments).map((unit) => unit.pieces.map((piece) => piece.text).join(''));

describe('groupWordUnits', () => {
  it('keeps a word whole when a chord sits inside it', () => {
    expect(texts([seg('G', 'Give me faith to trust what you sa'), seg('C', 'y')])).toEqual([
      'Give ',
      'me ',
      'faith ',
      'to ',
      'trust ',
      'what ',
      'you ',
      'say',
    ]);
  });

  it('joins several chords inside one word and keeps each chord on its own piece', () => {
    const [unit] = groupWordUnits([
      seg('A', 'su', 'a'),
      seg('B', 'rr', 'b'),
      seg('C', 'ender', 'c'),
    ]);
    expect(unit?.pieces.map((piece) => piece.chord)).toEqual(['A', 'B', 'C']);
  });

  it('breaks between words when a chord starts a word', () => {
    expect(texts([seg('G', 'see my '), seg('C', 'victory')])).toEqual(['see ', 'my ', 'victory']);
  });

  it('keeps a trailing chord-only segment with the word before it', () => {
    expect(texts([seg('G', 'amen'), seg('C', '')])).toEqual(['amen']);
  });

  it('keeps leading spaces as their own unit', () => {
    expect(texts([seg('G', '  hey')])).toEqual(['  ', 'hey']);
  });

  it('breaks after each Chinese character but keeps punctuation with it', () => {
    expect(texts([seg('G', '我愛'), seg('C', '你，主')])).toEqual(['我', '愛', '你，', '主']);
  });

  it('yields no units for no segments', () => {
    expect(groupWordUnits([])).toEqual([]);
  });
});
