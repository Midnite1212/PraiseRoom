import { describe, expect, it } from 'vitest';

import { foldChordChart, isChordLine, pasteChart } from './chart-fold';

describe('isChordLine', () => {
  it('accepts chords with bars, repeats and N.C., and rejects lyrics', () => {
    expect(isChordLine('G   D/F#  Em7  Csus4')).toBe(true);
    expect(isChordLine('| G | C | x2')).toBe(true);
    expect(isChordLine('Amazing grace')).toBe(false);
    expect(isChordLine('A man named Em')).toBe(false);
    expect(isChordLine('   ')).toBe(false);
    expect(isChordLine('x2')).toBe(false);
  });
});

describe('foldChordChart', () => {
  it('puts each chord before the character at its column', () => {
    expect(foldChordChart('G        C     G\nAmazing grace, how sweet')).toBe(
      '[G]Amazing g[C]race, [G]how sweet'
    );
  });

  it('places the first chord before the first word and pads chords past the end of the lyric', () => {
    expect(foldChordChart('  G       D\n  Hi')).toBe('[G]Hi      [D]');
  });

  it('counts a wide character as two columns', () => {
    expect(foldChordChart('G    C\n奇異恩典')).toBe('[G]奇異恩[C]典');
  });

  it('keeps a chord-only line as bracketed chords', () => {
    expect(foldChordChart('| G | C |\n\nlyric line')).toBe('[G] [C]\n\nlyric line');
    expect(foldChordChart('G C\nD')).toBe('[G] [C]\n[D]');
  });

  it('turns [Chorus] lines into section headers and does not pair a chord line with one', () => {
    expect(foldChordChart('[Verse 1]\nG   C\nHello there\n\nD\n[Chorus]\nGo')).toBe(
      '{Verse 1}\n[G]Hell[C]o there\n\n[D]\n{Chorus}\nGo'
    );
  });

  it('leaves lyrics and existing inline chords untouched', () => {
    expect(foldChordChart('[G]Already folded\r\nplain')).toBe('[G]Already folded\nplain');
  });
});

describe('pasteChart', () => {
  const chart = 'G   C\nHello there';

  it('folds a chart into the text at the selection and puts the caret after it', () => {
    expect(pasteChart('ab|cd', 2, 3, chart)).toEqual({
      value: 'ab[G]Hell[C]o therecd',
      caret: 2 + '[G]Hell[C]o there'.length,
    });
  });

  it('leaves ordinary pastes, single lines and charts without chord lines to the browser', () => {
    expect(pasteChart('', 0, 0, 'just words\nmore words')).toBeNull();
    expect(pasteChart('', 0, 0, 'Am')).toBeNull();
    expect(pasteChart('', 0, 0, '[G]Already\n[C]folded')).toBeNull();
  });
});
