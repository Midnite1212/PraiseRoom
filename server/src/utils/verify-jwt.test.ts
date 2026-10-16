import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { SignJWT } from 'jose';

import { TestAuthServer, startTestAuthServer } from '../testing/neonAuth';
import verifyToken from './verify-jwt';

const USER_ID = '860dc360-609f-4b7d-9e70-ec93fe6414d3';

describe('verifyToken', () => {
  const originalUrl = process.env.NEON_AUTH_BASE_URL;
  let auth: TestAuthServer;
  let otherAuth: TestAuthServer;

  before(async () => {
    auth = await startTestAuthServer();
    otherAuth = await startTestAuthServer();
    process.env.NEON_AUTH_BASE_URL = auth.url;
  });

  after(async () => {
    await Promise.all([auth.close(), otherAuth.close()]);
    if (originalUrl === undefined) delete process.env.NEON_AUTH_BASE_URL;
    else process.env.NEON_AUTH_BASE_URL = originalUrl;
  });

  it('returns the id, email, and name of a valid Neon Auth token', async () => {
    const token = await auth.sign({ email: 'user@example.com', name: 'Test User', sub: USER_ID });
    assert.deepEqual(await verifyToken(token), {
      emailAddress: 'user@example.com',
      id: USER_ID,
      name: 'Test User',
    });
  });

  it('accepts a token without email or name', async () => {
    assert.deepEqual(await verifyToken(await auth.sign({ sub: USER_ID })), {
      emailAddress: undefined,
      id: USER_ID,
      name: undefined,
    });
  });

  it('rejects a token from another issuer, an expired token, or one signed by another key', async () => {
    for (const token of [
      await auth.sign({ sub: USER_ID }, { issuer: 'https://evil.example' }),
      await auth.sign({ sub: USER_ID }, { expiresIn: '-1m' }),
      await otherAuth.sign({ sub: USER_ID }, { issuer: auth.origin }),
    ]) {
      assert.equal(await verifyToken(token), null);
    }
  });

  it('rejects a missing or malformed subject and banned users', async () => {
    for (const claims of [{}, { sub: '' }, { sub: 'has spaces' }, { banned: true, sub: USER_ID }]) {
      assert.equal(await verifyToken(await auth.sign(claims)), null, JSON.stringify(claims));
    }
  });

  it('rejects an HS256 token and garbage', async () => {
    const hs256 = await new SignJWT({ sub: USER_ID })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(auth.origin)
      .sign(new TextEncoder().encode('a-shared-secret-that-is-long-enough'));
    for (const token of [hs256, 'garbage', '']) {
      assert.equal(await verifyToken(token), null);
    }
  });

  it('rejects every token when NEON_AUTH_BASE_URL is unset', async () => {
    const token = await auth.sign({ sub: USER_ID });
    delete process.env.NEON_AUTH_BASE_URL;
    try {
      assert.equal(await verifyToken(token), null);
    } finally {
      process.env.NEON_AUTH_BASE_URL = auth.url;
    }
  });

  it('switches key sets when NEON_AUTH_BASE_URL changes', async () => {
    process.env.NEON_AUTH_BASE_URL = otherAuth.url;
    try {
      assert.equal((await verifyToken(await otherAuth.sign({ sub: USER_ID })))?.id, USER_ID);
    } finally {
      process.env.NEON_AUTH_BASE_URL = auth.url;
    }
  });
});
