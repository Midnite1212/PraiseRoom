import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { UpstreamError, fetchPage, isAllowedUrl } from './fetchPage';

describe('isAllowedUrl', () => {
  it('allows https chord-site hosts only', () => {
    assert.ok(isAllowedUrl('https://pnwchords.com/morning-light/'));
    for (const url of [
      'http://pnwchords.com/x',
      'https://pnwchords.com:8443/x',
      'https://evil.example/x',
      'https://pnwchords.com.evil.example/x',
      'https://169.254.169.254/latest',
      'not a url',
    ]) {
      assert.ok(!isAllowedUrl(url), url);
    }
  });
});

describe('fetchPage', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('refuses redirects to hosts outside the allowlist', async () => {
    mock.method(
      globalThis,
      'fetch',
      async () =>
        new Response(null, { status: 302, headers: { location: 'https://evil.example/' } })
    );
    await assert.rejects(fetchPage('https://pnwchords.com/x/'), (error: unknown) => {
      return error instanceof UpstreamError && error.kind === 'blocked';
    });
  });

  it('maps 404 and network failures to upstream errors', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }));
    await assert.rejects(
      fetchPage('https://pnwchords.com/x/'),
      (error: unknown) => error instanceof UpstreamError && error.kind === 'not-found'
    );
    mock.restoreAll();
    mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('fetch failed');
    });
    await assert.rejects(
      fetchPage('https://pnwchords.com/x/'),
      (error: unknown) => error instanceof UpstreamError && error.kind === 'unavailable'
    );
  });

  it('never calls fetch for a disallowed url', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('ok'));
    await assert.rejects(fetchPage('https://evil.example/'), UpstreamError);
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
