import assert from 'node:assert/strict';
import { IncomingHttpHeaders, Server, createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { after, afterEach, before, describe, it, mock } from 'node:test';

import express from 'express';

import { createAuthRouter, neonCookies, safeNextPath, toFirstPartyCookie } from './neonAuth.routes';

const SESSION_COOKIE = '__Secure-neon-auth.session_token';
const CHALLENGE_COOKIE = '__Secure-neon-auth.session_challenge';

type Recorded = { method?: string; url?: string; headers: IncomingHttpHeaders; body: string };

const listen = async (server: Server): Promise<string> => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
};

const close = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

describe('Neon Auth routes', () => {
  const originalUrl = process.env.NEON_AUTH_BASE_URL;
  const recorded: Recorded[] = [];
  let upstream: Server;
  let app: Server;
  let appUrl: string;
  let upstreamUrl: string;

  before(async () => {
    upstream = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        recorded.push({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: Buffer.concat(chunks).toString(),
        });
        res.setHeader('content-type', 'application/json');
        if (req.url?.includes('/get-session')) {
          res.setHeader('set-auth-jwt', 'jwt-from-neon');
          res.setHeader('set-cookie', [
            `${SESSION_COOKIE}=session-from-neon; Path=/; Secure; SameSite=None; Partitioned`,
          ]);
          res.end(JSON.stringify({ session: { id: 's1' }, user: { id: 'u1' } }));
          return;
        }
        res.setHeader('x-internal', 'not for the browser');
        res.setHeader('set-cookie', ['first=1; Path=/', 'second=2; Path=/']);
        res.end(JSON.stringify({ ok: true }));
      });
    });
    upstreamUrl = await listen(upstream);
    process.env.NEON_AUTH_BASE_URL = `${upstreamUrl}/neondb/auth/`;

    const expressApp = express();
    expressApp.use(createAuthRouter());
    expressApp.use(express.json());
    app = createServer(expressApp);
    appUrl = await listen(app);
  });

  afterEach(() => {
    recorded.length = 0;
    mock.restoreAll();
  });

  after(async () => {
    await Promise.all([close(upstream), close(app)]);
    if (originalUrl === undefined) delete process.env.NEON_AUTH_BASE_URL;
    else process.env.NEON_AUTH_BASE_URL = originalUrl;
  });

  it('forwards the method, sub-path, query, and raw body to Neon Auth', async () => {
    const body = JSON.stringify({ email: 'user@example.com', password: 'secret' });
    const res = await fetch(`${appUrl}/api/auth/sign-in/email?source=test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://app.example' },
      body,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    const [call] = recorded;
    assert.equal(call?.method, 'POST');
    assert.equal(call?.url, '/neondb/auth/sign-in/email?source=test');
    assert.equal(call?.body, body);
    assert.equal(call?.headers.origin, 'https://app.example');
    assert.equal(call?.headers['content-type'], 'application/json');
  });

  it('forwards only Neon Auth cookies upstream', async () => {
    await fetch(`${appUrl}/api/auth/get-session`, {
      headers: { cookie: `other=1; ${SESSION_COOKIE}=abc; tracking=2` },
    });
    assert.equal(recorded[0]?.headers.cookie, `${SESSION_COOKIE}=abc`);
  });

  it('passes the JWT header and rewrites cookies as first-party', async () => {
    const res = await fetch(`${appUrl}/api/auth/get-session`);
    assert.equal(res.headers.get('set-auth-jwt'), 'jwt-from-neon');
    assert.deepEqual(res.headers.getSetCookie(), [
      `${SESSION_COOKIE}=session-from-neon; Path=/; HttpOnly; Secure; SameSite=Lax`,
    ]);
  });

  it('never lets the browser revalidate a session into a stale JWT', async () => {
    const first = await fetch(`${appUrl}/api/auth/get-session`);
    assert.equal(first.headers.get('cache-control'), 'no-store');
    assert.equal(first.headers.get('etag'), null);
    const revalidated = await fetch(`${appUrl}/api/auth/get-session`, {
      headers: { 'if-none-match': '*' },
    });
    assert.equal(revalidated.status, 200);
    assert.equal(revalidated.headers.get('set-auth-jwt'), 'jwt-from-neon');
  });

  it('returns every Set-Cookie header separately and drops unlisted headers', async () => {
    const res = await fetch(`${appUrl}/api/auth/sign-out`, { method: 'POST' });
    const cookies = res.headers.getSetCookie().map((cookie) => cookie.split(';')[0]);
    assert.deepEqual(cookies, ['first=1', 'second=2']);
    assert.equal(res.headers.get('x-internal'), null);
  });

  it('answers 503 without contacting Neon when auth is not configured', async () => {
    delete process.env.NEON_AUTH_BASE_URL;
    try {
      const res = await fetch(`${appUrl}/api/auth/get-session`);
      assert.equal(res.status, 503);
      assert.equal(await res.json(), 'Sign-in is not configured');
      assert.equal(recorded.length, 0);
    } finally {
      process.env.NEON_AUTH_BASE_URL = `${upstreamUrl}/neondb/auth/`;
    }
  });

  it('answers 502 when Neon Auth is unreachable', async () => {
    mock.method(console, 'error', () => undefined);
    process.env.NEON_AUTH_BASE_URL = 'http://127.0.0.1:9/neondb/auth';
    try {
      const res = await fetch(`${appUrl}/api/auth/get-session`);
      assert.equal(res.status, 502);
      assert.equal(await res.json(), 'Sign-in is unavailable');
    } finally {
      process.env.NEON_AUTH_BASE_URL = `${upstreamUrl}/neondb/auth/`;
    }
  });

  it('redirects the sign-in callback to a safe local path', async () => {
    const res = await fetch(`${appUrl}/api/auth-callback?next=/setlist`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    assert.equal(new URL(res.headers.get('location') ?? '', appUrl).pathname, '/setlist');
    assert.equal(recorded.length, 0);
  });

  it('exchanges the Google verifier for session cookies, then goes to next', async () => {
    const res = await fetch(
      `${appUrl}/api/auth-callback?next=/setlist&neon_auth_session_verifier=verifier-1`,
      { redirect: 'manual', headers: { cookie: `${CHALLENGE_COOKIE}=challenge-1` } }
    );
    assert.equal(res.status, 302);
    assert.equal(new URL(res.headers.get('location') ?? '', appUrl).pathname, '/setlist');
    assert.match(
      res.headers.getSetCookie().join(' | '),
      new RegExp(`${SESSION_COOKIE}=session-from-neon`)
    );
    const [exchange] = recorded;
    assert.equal(exchange?.method, 'GET');
    assert.match(exchange?.url ?? '', /^\/neondb\/auth\/get-session\?/);
    assert.match(exchange?.url ?? '', /neon_auth_session_verifier=verifier-1/);
    assert.equal(exchange?.headers.cookie, `${CHALLENGE_COOKIE}=challenge-1`);
  });

  it('skips the exchange without a challenge cookie', async () => {
    const res = await fetch(
      `${appUrl}/api/auth-callback?next=/setlist&neon_auth_session_verifier=verifier-1`,
      { redirect: 'manual' }
    );
    assert.equal(new URL(res.headers.get('location') ?? '', appUrl).pathname, '/setlist');
    assert.equal(recorded.length, 0);
  });

  describe('helpers', () => {
    it('keeps local next paths and falls back to / for anything else', () => {
      assert.equal(safeNextPath('/setlist/view/1?x=2'), '/setlist/view/1?x=2');
      for (const value of ['//evil.example', '/\\evil.example', 'https://evil.example', '', 5]) {
        assert.equal(safeNextPath(value), '/', String(value));
      }
    });

    it('keeps only Neon Auth cookies', () => {
      assert.equal(neonCookies(undefined), '');
      assert.equal(
        neonCookies(`a=1; ${SESSION_COOKIE}=x;${CHALLENGE_COOKIE}=y`),
        `${SESSION_COOKIE}=x; ${CHALLENGE_COOKIE}=y`
      );
    });

    it('forces HttpOnly, Secure, and SameSite=Lax and drops Partitioned', () => {
      assert.equal(
        toFirstPartyCookie('a=1; Path=/; Max-Age=60; samesite=none; Partitioned'),
        'a=1; Path=/; Max-Age=60; HttpOnly; Secure; SameSite=Lax'
      );
    });
  });
});
