import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { importFromText, importFromUrl } from './importer';

const wtPage = (originalKey: string, lines: Array<Array<[string, string]>>): string =>
  [
    '<meta property="cludo:englishSongTitle" content="Morning Light" />',
    '<meta property="cludo:worshipLeader" content="Invented Band">',
    `<meta property="cludo:originalKey" content="${originalKey}">`,
    ...lines.map(
      (segments) =>
        `<div class="chord-pro-line">${segments
          .map(
            ([chord, lyric]) =>
              `<div class="chord-pro-note">${chord}</div><div class="chord-pro-lyric">${lyric}</div>`
          )
          .join('')}</div>`
    ),
  ].join('\n');

const importWt = async (html: string) => {
  mock.method(globalThis, 'fetch', async () => new Response(html));
  return importFromUrl('https://www.worshiptogether.com/songs/morning-light-invented-band/');
};

describe('importFromUrl', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('moves a chart written in another key into the recording key', async () => {
    const chart = await importWt(
      wtPage('B', [
        [
          ['A', 'Light on the '],
          ['F#m7', 'hill'],
        ],
        [
          ['Esus', 'Calling us '],
          ['D2', 'home'],
        ],
        [['A', 'Again']],
      ])
    );
    assert.equal(chart.originalKey, 'B');
    assert.equal(
      chart.chordLyrics,
      '[B]Light on the [G#m7]hill\n[F#sus]Calling us [E2]home\n[B]Again'
    );
  });

  it('leaves a chart alone when its chords already fit the recording key', async () => {
    // Starts and ends on IV, which pulls the key guess towards C.
    const lines: Array<Array<[string, string]>> = [
      [
        ['C', 'Light on the '],
        ['G', 'hill'],
      ],
      [
        ['D', 'Calling us '],
        ['Em', 'home'],
      ],
      [['C', 'Again']],
    ];
    const chart = await importWt(wtPage('G', lines));
    assert.equal(chart.originalKey, 'G');
    assert.equal(chart.chordLyrics, '[C]Light on the [G]hill\n[D]Calling us [Em]home\n[C]Again');
  });
});

describe('importFromText', () => {
  it('converts pasted text and infers its key', () => {
    const chart = importFromText('Chorus\nD        A\nSing it loud\nBm       G\nSing it out\nD');
    assert.equal(chart.originalKey, 'D');
    assert.equal(chart.chordLyrics, '{Chorus}\n[D]Sing it l[A]oud\n[Bm]Sing it o[G]ut\n[D]');
  });
});
