import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  cleanChart,
  decodeEntities,
  isChordLine,
  sectionLabel,
  tidy,
  toChordLyrics,
} from './chart';

describe('sectionLabel', () => {
  it('normalises section names', () => {
    const cases: Array<[string, string]> = [
      ['Verse1', 'Verse 1'],
      ['[Pre-Chorus 2]', 'Prechorus 2'],
      ['CHORUS:', 'Chorus'],
      ['Stanza 3', 'Verse 3'],
      ['Ending', 'Outro'],
    ];
    for (const [raw, expected] of cases) assert.equal(sectionLabel(raw), expected, raw);
  });

  it('leaves lyric lines alone', () => {
    for (const lyric of ['Break every wall down', 'Verse of the morning sun', 'End of the road']) {
      assert.equal(sectionLabel(lyric), null, lyric);
    }
  });
});

describe('isChordLine', () => {
  it('detects chord rows including bar lines and repeat marks', () => {
    assert.ok(isChordLine('G        C/E     D'));
    assert.ok(isChordLine('| Em  C | G  D |  x2'));
    assert.ok(!isChordLine('A river runs through the town'));
    assert.ok(!isChordLine(''));
  });
});

describe('toChordLyrics', () => {
  it('merges chords written above lyrics into inline chords at the same column', () => {
    const chart = [
      'Verse1',
      `${'G'.padEnd(16)}C`,
      '   Light on the hillside',
      '        Em   D',
      'Calling us home',
    ].join('\n');
    assert.equal(
      toChordLyrics(chart),
      '{Verse 1}\n[G]Light on the [C]hillside\nCalling [Em]us ho[D]me'
    );
  });

  it('keeps chord-only rows and turns bracketed headers into sections', () => {
    assert.equal(
      toChordLyrics('[Intro]\nG   D   Em   C\n\n[Chorus]\nC     G\nSing it loud'),
      '{Intro}\n[G]   [D]   [Em]   [C]\n\n{Chorus}\n[C]Sing i[G]t loud'
    );
  });

  it('passes through charts already in the app format', () => {
    const ours = '{Verse 1}\n[G]Walk in the [D]light\n\n{Chorus}\n[C]Sing';
    assert.equal(toChordLyrics(ours), ours);
  });

  it('understands ChordPro chorus and comment directives', () => {
    assert.equal(
      toChordLyrics('{title: Invented Song}\n{c: Verse 1}\n[G]Walk\n{soc}\n[C]Sing\n{eoc}'),
      '{Verse 1}\n[G]Walk\n\n{Chorus}\n[C]Sing'
    );
  });
});

describe('cleanChart', () => {
  const base =
    '{Verse 1}\n[G]Line one\n\n{Pre-Chorus}\n[C]Rising\n\n{Chorus}\n[D]Sing out\n[Em]Sing again';

  it('expands repeat directives into a copy of the named section', () => {
    assert.equal(
      cleanChart(`${base}\n\n{Verse 2}\n[G]Line two\n(Repeat Pre-Chorus & Chorus)`),
      `${base}\n\n{Verse 2}\n[G]Line two\n\n{Prechorus}\n[C]Rising\n\n{Chorus}\n[D]Sing out\n[Em]Sing again`
    );
    assert.equal(
      cleanChart(`${base}\nREPEAT CHORUS 2X DOWN`),
      `${base}\n\n{Chorus}\n[D]Sing out\n[Em]Sing again`
    );
  });

  it('removes the gap between a leading chord and the first word, but not between chords', () => {
    assert.equal(
      cleanChart('{Verse 1}\n[G]     Light on the [C]hill\n[G]   [C]   [D]'),
      '{Verse 1}\n[G]Light on the [C]hill\n[G]   [C]   [D]'
    );
  });

  it('keeps lyric lines that start with "repeat"', () => {
    const lyric = '{Verse 1}\n[G]Repeat the sounding joy';
    assert.equal(cleanChart(lyric), lyric);
  });

  it('drops site credits, metadata lines, and empty sections', () => {
    assert.equal(
      cleanChart('Artist: Someone\nTabbed by: someone\n{Intro}\n\n{Verse 1}\n[G]Line\n{Outro}'),
      '{Verse 1}\n[G]Line'
    );
  });
});

describe('tidy', () => {
  it('numbers repeated plain verse headers and normalises blank lines', () => {
    assert.equal(
      tidy('{Verse}\n\n[G]One\n\n\n{Verse}\n[G]Two\n'),
      '{Verse 1}\n[G]One\n\n{Verse 2}\n[G]Two'
    );
  });
});

describe('chord placement and hostile input', () => {
  it('counts Chinese characters as two columns', () => {
    assert.equal(toChordLyrics('G       D\n主你是我力量'), '[G]主你是我[D]力量');
  });

  it('pads chords that sit past the end of the lyric in order', () => {
    assert.equal(toChordLyrics('G    C   D\nLight'), '[G]Light[C]    [D]');
  });

  it('handles very long whitespace lines quickly', () => {
    const started = Date.now();
    toChordLyrics(`${'\t'.repeat(29_999)}x`);
    toChordLyrics(`[Chorus]${' '.repeat(29_990)}x`);
    assert.ok(Date.now() - started < 500);
  });
});

describe('decodeEntities', () => {
  it('decodes astral code points and drops NUL and invalid ones', () => {
    assert.equal(decodeEntities('Amen &#128591;&#0;&#xD800;!'), 'Amen 🙏!');
  });
});
