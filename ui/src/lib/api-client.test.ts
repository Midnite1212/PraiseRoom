import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiError, apiRequest, clearAuthToken } from './api-client';

const encodeToken = (exp: number): string =>
  `${btoa(JSON.stringify({ alg: 'EdDSA' }))}.${btoa(JSON.stringify({ exp }))}.signature`;

const sessionResponse = (jwt: string | null) =>
  new Response(JSON.stringify(jwt ? { user: { id: 'u1', email: 'a@b.c', name: 'A' } } : null), {
    headers: jwt ? { 'set-auth-jwt': jwt } : {},
  });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  clearAuthToken();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('sends the bearer token, encodes the query, and parses with the schema', async () => {
    const token = encodeToken(Math.floor(Date.now() / 1000) + 600);
    fetchMock
      .mockResolvedValueOnce(sessionResponse(token))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, extra: 1 })));

    const data = await apiRequest('/api/things', z.object({ ok: z.boolean() }), {
      query: { keyword: 'grace', tempo: ['Fast', 'Slow'], page: 2, skipped: undefined },
    });

    expect(data).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[1] ?? [];
    expect(url).toBe('/api/things?keyword=grace&tempo=Fast&tempo=Slow&page=2');
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`);
  });

  it('reuses the token until shortly before it expires', async () => {
    fetchMock
      .mockResolvedValueOnce(sessionResponse(encodeToken(Math.floor(Date.now() / 1000) + 600)))
      .mockImplementation(async () => new Response('{}'));

    await apiRequest('/api/a', z.object({}));
    await apiRequest('/api/b', z.object({}));

    const sessionCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/auth/get-session');
    expect(sessionCalls).toHaveLength(1);
  });

  it('omits the Authorization header when signed out', async () => {
    fetchMock
      .mockResolvedValueOnce(sessionResponse(null))
      .mockResolvedValueOnce(new Response('{}'));

    await apiRequest('/api/public', z.object({}));

    const [, init] = fetchMock.mock.calls[1] ?? [];
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);
  });

  it('throws an ApiError with the status for a failed response', async () => {
    fetchMock
      .mockResolvedValueOnce(sessionResponse(null))
      .mockResolvedValueOnce(new Response('nope', { status: 404 }));

    await expect(apiRequest('/api/missing', z.object({}))).rejects.toEqual(new ApiError(404));
  });

  it('rejects a response that does not match the schema', async () => {
    fetchMock
      .mockResolvedValueOnce(sessionResponse(null))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: 'yes' })));

    await expect(apiRequest('/api/things', z.object({ ok: z.boolean() }))).rejects.toThrow(
      z.ZodError
    );
  });
});
