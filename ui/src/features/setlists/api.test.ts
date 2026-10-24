import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAuthToken } from '@/lib/api-client';
import { requestUrl, sessionResponse } from '@/test/mock-fetch';

import { duplicateSetlist, publicSetlistUrl, setSetlistFolders, setSetlistSongs } from './api';

describe('publicSetlistUrl', () => {
  it('builds the public view link on the given origin', () => {
    expect(publicSetlistUrl('68cfc5ca92a58a4a2a791193', 'https://praiseroom.vercel.app')).toBe(
      'https://praiseroom.vercel.app/setlist/view/68cfc5ca92a58a4a2a791193'
    );
  });
});

describe('setlist requests', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockImplementation(async (input) =>
      requestUrl(input).includes('get-session')
        ? sessionResponse()
        : new Response(JSON.stringify({ _id: 'copy1' }))
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    clearAuthToken();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  const lastApiCall = () => {
    const call = fetchMock.mock.calls.findLast(([input]) => requestUrl(input).startsWith('/api/'));
    return { url: requestUrl(call?.[0] ?? ''), init: call?.[1] };
  };

  it('duplicates with a POST of the source id and the copy name', async () => {
    await expect(duplicateSetlist('abc', 'Sunday (copy)')).resolves.toEqual({ _id: 'copy1' });
    const { url, init } = lastApiCall();
    expect(url).toBe('/api/setlists/duplicate');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ id: 'abc', name: 'Sunday (copy)' }));
  });

  it('links folders with a PUT of only the folder ids', async () => {
    await setSetlistFolders('abc', ['f1', 'f2']);
    const { url, init } = lastApiCall();
    expect(url).toBe('/api/setlists/update');
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ id: 'abc', groupIds: ['f1', 'f2'] }));
  });

  it('sets the songs with a PUT of only the song ids', async () => {
    await setSetlistSongs('abc', ['s1', 's2']);
    const { url, init } = lastApiCall();
    expect(url).toBe('/api/setlists/update');
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ id: 'abc', songs: ['s1', 's2'] }));
  });
});
