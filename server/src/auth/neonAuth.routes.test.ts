import express from 'express';
import assert from 'node:assert/strict';
import { IncomingHttpHeaders, Server, createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { after, afterEach, before, describe, it, mock } from 'node:test';
import { createAuthRouter, safeNextPath } from './neonAuth.routes';

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
  const originalEnv = {
    url: process.env.NEON_AUTH_BASE_URL,
    secret: process.env.NEON_AUTH_COOKIE_SECRET,
  };
  const recorded: Recorded[] = [];
  let upstream: Server;
  let app: Server;
  let appUrl: string;

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
          res.setHeader('set-cookie', [
            `${SESSION_COOKIE}=session-from-neon; Path=/; HttpOnly; Secure; SameSite=Lax`,
          ]);
          res.end(JSON.stringify({ session: { id: 's1' }, user: { id: 'u1' } }));
          return;
        }
        res.setHeader('set-cookie', ['first=1; Path=/', 'second=2; Path=/']);
        res.end(JSON.stringify({ ok: true }));
      });
    });
    process.env.NEON_AUTH_BASE_URL = `${await listen(upstream)}/neondb/auth`;
    process.env.NEON_AUTH_COOKIE_SECRET = 'a'.repeat(32);

    const expressApp = express();
    expressApp.use(createAuthRouter());
    expressApp.use(express.json());
    app = createServer(expressApp);
    appUrl = await listen(app);
  });

  afterEach(() => {
    recorded.length = 0;
  });

  after(async () => {
    await Promise.all([close(upstream), close(app)]);
    for (const [key, value] of [
      ['NEON_AUTH_BASE_URL', originalEnv.url],
      ['NEON_AUTH_COOKIE_SECRET', originalEnv.secret],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('forwards the method, sub-path, query, and raw body to Neon Auth', async () => {
    const body = JSON.stringify({ email: 'user@example.com', password: 'secret' });
    const res = await fetch(`${appUrl}/api/auth/sign-in/email?source=test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    const [call] = recorded;
    assert.equal(call?.method, 'POST');
    assert.match(call?.url ?? '', /^\/neondb\/auth\/sign-in\/email(\?.*)?$/);
    assert.equal(call?.body, body);
  });

  it('returns every Set-Cookie header separately', async () => {
    const res = await fetch(`${appUrl}/api/auth/sign-out`, { method: 'POST' });
    const cookies = res.headers.getSetCookie().map((cookie) => cookie.split(';')[0]);
    assert.ok(cookies.includes('first=1'), cookies.join(' | '));
    assert.ok(cookies.includes('second=2'), cookies.join(' | '));
  });

  it('answers 503 without contacting Neon when auth is not configured', async () => {
    const secret = process.env.NEON_AUTH_COOKIE_SECRET;
    delete process.env.NEON_AUTH_COOKIE_SECRET;
    try {
      const res = await fetch(`${appUrl}/api/auth/get-session`);
      assert.equal(res.status, 503);
      assert.equal(await res.json(), 'Sign-in is not configured');
      assert.equal(recorded.length, 0);
    } finally {
      process.env.NEON_AUTH_COOKIE_SECRET = secret;
    }
  });

  it('treats a cookie secret shorter than 32 characters as unconfigured', async () => {
    const secret = process.env.NEON_AUTH_COOKIE_SECRET;
    const consoleError = mock.method(console, 'error', () => undefined);
    process.env.NEON_AUTH_COOKIE_SECRET = 'too-short';
    try {
      const res = await fetch(`${appUrl}/api/auth/get-session`);
      assert.equal(res.status, 503);
      assert.equal(recorded.length, 0);
      assert.doesNotMatch(String(consoleError.mock.calls[0]?.arguments), /too-short/);
    } finally {
      process.env.NEON_AUTH_COOKIE_SECRET = secret;
      consoleError.mock.restore();
    }
  });

  it('redirects the sign-in callback to a safe local path', async () => {
    const res = await fetch(`${appUrl}/api/auth-callback?next=/setlist`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    assert.equal(new URL(res.headers.get('location') ?? '', appUrl).pathname, '/setlist');
  });

  it('exchanges the Google verifier for session cookies, then drops it from the URL', async () => {
    const res = await fetch(
      `${appUrl}/api/auth-callback?next=/setlist&neon_auth_session_verifier=verifier-1`,
      { redirect: 'manual', headers: { cookie: `${CHALLENGE_COOKIE}=challenge-1` } }
    );
    assert.equal(res.status, 302);
    const location = new URL(res.headers.get('location') ?? '', appUrl);
    assert.equal(location.pathname, '/api/auth-callback');
    assert.equal(location.searchParams.get('next'), '/setlist');
    assert.equal(location.searchParams.has('neon_auth_session_verifier'), false);
    const cookies = res.headers.getSetCookie().join(' | ');
    assert.match(cookies, new RegExp(`${SESSION_COOKIE}=session-from-neon`));
    const [exchange] = recorded;
    assert.match(exchange?.url ?? '', /get-session/);
    assert.match(exchange?.url ?? '', /neon_auth_session_verifier=verifier-1/);
    assert.match(String(exchange?.headers.cookie), new RegExp(CHALLENGE_COOKIE));
  });

  describe('safeNextPath', () => {
    it('keeps local paths and falls back to / for anything else', () => {
      assert.equal(safeNextPath('/setlist/view/1?x=2'), '/setlist/view/1?x=2');
      for (const value of ['//evil.example', '/\\evil.example', 'https://evil.example', '', 5]) {
        assert.equal(safeNextPath(value), '/', String(value));
      }
    });
  });
});
