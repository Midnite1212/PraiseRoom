import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { UpstreamError } from './fetchPage';
import {
  matchWorshipTogether,
  parsePnw,
  parsePnwSearch,
  parseUltimateGuitar,
  parseUltimateGuitarSearch,
  parseWorshipTogether,
  parseWorshipTogetherSitemap,
  searchSource,
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

describe('WorshipTogether sitemap loading', () => {
  const songUrl = 'https://www.worshiptogether.com/songs/morning-light-invented-band/';
  const sitemap = `<url><loc>${songUrl}</loc></url>`;
  let testTime = Date.UTC(2030, 0, 1);

  beforeEach(() => {
    testTime += 24 * 60 * 60 * 1000;
    mock.timers.enable({ apis: ['Date', 'setTimeout'], now: testTime });
    mock.method(AbortSignal, 'timeout', (timeoutMs: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    });
  });

  afterEach(() => {
    mock.restoreAll();
    mock.timers.reset();
  });

  it('allows a 12-second sitemap download while other searches time out after 8 seconds', async () => {
    const fetchMock = mock.method(
      globalThis,
      'fetch',
      (_url: string | URL | Request, options?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          setTimeout(() => resolve(new Response(sitemap)), 12_000);
          options?.signal?.addEventListener('abort', () => reject(new Error('Timed out')));
        })
    );
    const searches = Promise.allSettled([
      searchSource('worshiptogether', 'Morning Light'),
      searchSource('ultimate-guitar', 'Morning Light'),
    ]);
    mock.timers.tick(8_000);
    assert.equal(fetchMock.mock.calls[0]?.arguments[1]?.signal?.aborted, false);
    assert.equal(fetchMock.mock.calls[1]?.arguments[1]?.signal?.aborted, true);
    mock.timers.tick(4_000);
    const [worshipTogether, ultimateGuitar] = await searches;
    assert.equal(worshipTogether?.status, 'fulfilled');
    if (worshipTogether?.status === 'fulfilled') {
      assert.deepEqual(
        worshipTogether.value.map(({ url }) => url),
        [songUrl]
      );
    }
    assert.equal(ultimateGuitar?.status, 'rejected');
  });

  it('shares one in-flight sitemap across queries and caches success for six hours', async () => {
    let finishDownload: (response: Response) => void = () => {};
    const download = new Promise<Response>((resolve) => {
      finishDownload = resolve;
    });
    const fetchMock = mock.method(globalThis, 'fetch', () => download);
    const first = searchSource('worshiptogether', 'Morning');
    const second = searchSource('worshiptogether', 'Invented Band');
    assert.equal(fetchMock.mock.callCount(), 1);
    finishDownload(new Response(sitemap));
    const [firstResults, secondResults] = await Promise.all([first, second]);
    assert.deepEqual(
      firstResults.map(({ url }) => url),
      [songUrl]
    );
    assert.deepEqual(secondResults, firstResults);

    mock.timers.tick(6 * 60 * 60 * 1000 - 1);
    assert.deepEqual(await searchSource('worshiptogether', 'Morning'), firstResults);
    assert.equal(fetchMock.mock.callCount(), 1);
    mock.timers.tick(1);
    fetchMock.mock.mockImplementation(async () => new Response(sitemap));
    assert.deepEqual(await searchSource('worshiptogether', 'Morning'), firstResults);
    assert.equal(fetchMock.mock.callCount(), 2);
  });

  it('times out the shared download after 25 seconds and retries after five minutes', async () => {
    const fetchMock = mock.method(
      globalThis,
      'fetch',
      (_url: string | URL | Request, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('Timed out')));
        })
    );
    const searches = Promise.all([
      assert.rejects(searchSource('worshiptogether', 'Morning'), UpstreamError),
      assert.rejects(searchSource('worshiptogether', 'Light'), UpstreamError),
    ]);
    assert.equal(fetchMock.mock.callCount(), 1);
    mock.timers.tick(24_999);
    assert.equal(fetchMock.mock.calls[0]?.arguments[1]?.signal?.aborted, false);
    mock.timers.tick(1);
    await searches;

    mock.timers.tick(5 * 60 * 1000 - 1);
    await assert.rejects(searchSource('worshiptogether', 'Morning'), /Recently failed/);
    assert.equal(fetchMock.mock.callCount(), 1);
    mock.timers.tick(1);
    fetchMock.mock.mockImplementation(async () => new Response(sitemap));
    assert.deepEqual(
      (await searchSource('worshiptogether', 'Morning')).map(({ url }) => url),
      [songUrl]
    );
    assert.equal(fetchMock.mock.callCount(), 2);
    await searchSource('worshiptogether', 'Light');
    assert.equal(fetchMock.mock.callCount(), 2);
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

describe('Ultimate Guitar capo in the text only', () => {
  it('applies a capo that is only written in the chart', () => {
    const html = encodeStore({
      store: {
        page: {
          data: {
            tab: { song_name: 'Morning Light', artist_name: 'Invented Band' },
            tab_view: {
              meta: { capo: 0 },
              wiki_tab: {
                content: 'Capo 2\n[tab][ch]G[/ch]   [ch]C[/ch]   [ch]D[/ch]   [ch]G[/ch][/tab]',
              },
            },
          },
        },
      },
    });
    assert.equal(
      parseUltimateGuitar(html, 'https://x')?.chordLyrics,
      'Capo 2\n[A]   [D]   [E]   [A]'
    );
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
