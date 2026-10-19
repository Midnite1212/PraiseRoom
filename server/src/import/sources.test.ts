import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  matchWorshipTogether,
  parsePnw,
  parsePnwSearch,
  parseUltimateGuitar,
  parseUltimateGuitarSearch,
  parseWorshipTogether,
  parseWorshipTogetherSitemap,
  sourceOf,
} from './sources';

const encodeStore = (store: unknown): string =>
  `<div class="js-store" data-content="${JSON.stringify(store)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')}"></div>`;

const wtLine = (segments: Array<[string, string]>): string =>
  `<div class="chord-pro-line">${segments
    .map(
      ([chord, lyric]) =>
        `<div class="chord-pro-segment"><div class="chord-pro-note">${chord}&nbsp;</div><div class="chord-pro-lyric">${lyric}</div></div>`
    )
    .join('')}</div>`;

describe('WorshipTogether', () => {
  it('reads song urls from the sitemap and matches every query word', () => {
    const urls = parseWorshipTogetherSitemap(
      [
        'https://www.worshiptogether.com/songs/morning-light-invented-band/',
        'https://www.worshiptogether.com/songs/morning-light-reprise-other-band/',
        'https://www.worshiptogether.com/songs/',
        'https://www.worshiptogether.com/artists/invented-band/',
      ]
        .map((url) => `<url><loc>${url}</loc></url>`)
        .join('')
    );
    assert.equal(urls.length, 2);
    const matches = matchWorshipTogether(urls, 'Morning Light invented');
    assert.deepEqual(
      matches.map((match) => match.title),
      ['Morning Light Invented Band']
    );
  });

  it('turns chord-pro segments into inline chords with section headers', () => {
    const html = [
      '<meta property="cludo:englishSongTitle" content="Morning Light " />',
      '<meta property="cludo:worshipLeader" content="Invented Band">',
      '<meta property="cludo:originalKey" content="B">',
      '<div class="detail"><span>BPM:</span> <p>112</p></div>',
      wtLine([['', 'Verse 1&#xD;']]),
      wtLine([
        ['A', 'Light on the '],
        ['F#m7', 'hillside&#xD;'],
      ]),
      wtLine([['', 'Chorus']]),
      wtLine([['D', 'Sing it loud']]),
    ].join('\n');
    assert.deepEqual(parseWorshipTogether(html, 'https://www.worshiptogether.com/songs/x/'), {
      source: 'worshiptogether',
      url: 'https://www.worshiptogether.com/songs/x/',
      title: 'Morning Light',
      artist: 'Invented Band',
      chordLyrics: '{Verse 1}\n[A]Light on the [F#m7]hillside\n\n{Chorus}\n[D]Sing it loud',
      recordingKey: 'B',
      bpm: 112,
    });
  });

  it('returns null for a lyrics-only page', () => {
    assert.equal(parseWorshipTogether(wtLine([['', 'Just words']]), 'https://x'), null);
  });
});

describe('Ultimate Guitar', () => {
  it('keeps chord results and ranks them by votes × rating', () => {
    const html = encodeStore({
      store: {
        page: {
          data: {
            results: [
              {
                type: 'Tabs',
                tab_url: 'https://tabs.ultimate-guitar.com/tab/a/tab-1',
                song_name: 'Song',
              },
              {
                type: 'Chords',
                tab_url: 'https://tabs.ultimate-guitar.com/tab/a/song-chords-1',
                song_name: 'Song',
                artist_name: 'Low Votes',
                votes: 2,
                rating: 5,
              },
              {
                type: 'Chords',
                tab_url: 'https://tabs.ultimate-guitar.com/tab/a/song-chords-2',
                song_name: 'Song',
                artist_name: 'High Votes',
                votes: 40,
                rating: 4.5,
              },
            ],
          },
        },
      },
    });
    assert.deepEqual(
      parseUltimateGuitarSearch(html).map((candidate) => candidate.artist),
      ['High Votes', 'Low Votes']
    );
  });

  it('converts [ch] markup and applies the capo', () => {
    const html = encodeStore({
      store: {
        page: {
          data: {
            tab: { song_name: 'Morning Light', artist_name: 'Invented Band' },
            tab_view: {
              meta: { capo: 2 },
              wiki_tab: {
                content:
                  '[Verse 1]\n[tab][ch]G[/ch]          [ch]C[/ch]\nLight on the hillside[/tab]\nTabbed by someone',
              },
            },
          },
        },
      },
    });
    const chart = parseUltimateGuitar(html, 'https://tabs.ultimate-guitar.com/tab/a/song-chords-2');
    assert.equal(chart?.title, 'Morning Light');
    assert.equal(chart?.chordLyrics, '{Verse 1}\n[A]Light on th[D]e hillside\nTabbed by someone');
  });
});

describe('Ultimate Guitar capo spelling', () => {
  it('spells capo-transposed chords in the key they sound in', () => {
    const html = encodeStore({
      store: {
        page: {
          data: {
            tab: { song_name: 'Morning Light', artist_name: 'Invented Band' },
            tab_view: {
              meta: { capo: 1 },
              wiki_tab: { content: '[tab][ch]G[/ch]   [ch]C[/ch]   [ch]D[/ch]   [ch]G[/ch][/tab]' },
            },
          },
        },
      },
    });
    assert.equal(parseUltimateGuitar(html, 'https://x')?.chordLyrics, '[Ab]   [Db]   [Eb]   [Ab]');
  });
});

describe('PNW Chords', () => {
  it('reads search result titles and artists', () => {
    const html =
      '<h2 class="post-title entry-title" itemprop="headline"><a href="https://pnwchords.com/morning-light-invented-band/" itemprop="url">Morning Light &#8211; Invented Band (A Writer)</a></h2>';
    assert.deepEqual(parsePnwSearch(html), [
      {
        source: 'pnwchords',
        url: 'https://pnwchords.com/morning-light-invented-band/',
        title: 'Morning Light',
        artist: 'Invented Band',
        votes: null,
      },
    ]);
  });

  it('converts the pre block', () => {
    const html =
      '<h1>Morning Light &#8211; Invented Band</h1><pre>Verse1\nG          C\nLight on the hillside\n</pre>';
    assert.equal(
      parsePnw(html, 'https://pnwchords.com/morning-light-invented-band/')?.chordLyrics,
      '{Verse 1}\n[G]Light on th[C]e hillside'
    );
  });
});

describe('sourceOf', () => {
  it('maps hosts to sources', () => {
    assert.equal(sourceOf('https://www.worshiptogether.com/songs/x/'), 'worshiptogether');
    assert.equal(sourceOf('https://tabs.ultimate-guitar.com/tab/a/b'), 'ultimate-guitar');
    assert.equal(sourceOf('https://pnwchords.com/x/'), 'pnwchords');
    assert.equal(sourceOf('https://example.com/x'), null);
  });
});
