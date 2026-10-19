import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { FakeRequestInit, callHandler, createRequest, createResponse } from '../testing/http';
import {
  convertImportText,
  fetchImportChart,
  getImportMetadata,
  searchImportCandidates,
} from './songImport.controllers';

const call = async (handler: Parameters<typeof callHandler>[0], init: FakeRequestInit) => {
  const res = createResponse();
  await callHandler(handler, createRequest(init), res);
  return res;
};

describe('song import controllers', () => {
  beforeEach(() => {
    mock.method(console, 'error', () => undefined);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('rejects missing, oversized, or non-string search queries', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(''));
    for (const q of [undefined, '', '   ', 'x'.repeat(101), ['a', 'b'], 'bad\0query']) {
      const res = await call(searchImportCandidates, { query: { q } });
      assert.equal(res.statusCode, 400);
    }
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('rejects links outside the supported chord sites without fetching', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(''));
    for (const url of [
      undefined,
      'https://example.com/song',
      'http://pnwchords.com/x/',
      'https://songbpm.com/@a/b',
    ]) {
      const res = await call(fetchImportChart, { body: { url } });
      assert.equal(res.statusCode, 400);
      assert.equal(res.body, 'Unsupported link');
    }
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('reports a page without a chart as 422 and an unreachable site as 502', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('<html>no chart</html>'));
    const empty = await call(fetchImportChart, { body: { url: 'https://pnwchords.com/x/' } });
    assert.equal(empty.statusCode, 422);

    mock.restoreAll();
    mock.method(console, 'error', () => undefined);
    mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('fetch failed');
    });
    const down = await call(fetchImportChart, { body: { url: 'https://pnwchords.com/x/' } });
    assert.equal(down.statusCode, 502);
    assert.equal(down.body, 'Chord site unavailable');
  });

  it('imports a chart from a supported link', async () => {
    mock.method(
      globalThis,
      'fetch',
      async () =>
        new Response(
          '<h1>Morning Light &#8211; Invented Band</h1><pre>Verse1\nG          C\nLight on the hillside\nD          G\nSinging us home</pre>'
        )
    );
    const res = await call(fetchImportChart, { body: { url: 'https://pnwchords.com/x/' } });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      source: 'pnwchords',
      url: 'https://pnwchords.com/x/',
      title: 'Morning Light',
      artist: 'Invented Band',
      bpm: null,
      chordLyrics: '{Verse 1}\n[G]Light on th[C]e hillside\n[D]Singing us [G]home',
      originalKey: 'G',
    });
  });

  it('converts pasted chart text and rejects text without chords', async () => {
    const ok = await call(convertImportText, {
      body: { text: '[Chorus]\nC     G\nSing it loud\nAm    F\nSing it out' },
    });
    assert.equal(ok.statusCode, 200);
    assert.equal(
      (ok.body as { chordLyrics: string }).chordLyrics,
      '{Chorus}\n[C]Sing i[G]t loud\n[Am]Sing i[F]t out'
    );

    const none = await call(convertImportText, { body: { text: 'Just some words\nand more' } });
    assert.equal(none.statusCode, 422);

    const invalid = await call(convertImportText, { body: { text: 42 } });
    assert.equal(invalid.statusCode, 400);
  });

  it('requires both title and artist for metadata', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(''));
    for (const query of [{ title: 'Song' }, { artist: 'Band' }, { title: '', artist: 'Band' }]) {
      const res = await call(getImportMetadata, { query });
      assert.equal(res.statusCode, 400);
    }
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
