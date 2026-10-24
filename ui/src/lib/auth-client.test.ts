import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestUrl } from '@/test/mock-fetch';

import { AuthError, authClient, fetchSession } from './auth-client';

const json = (body: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(body), init);

type Call = { path: string; method: string; body: unknown };

const stubFetch = (respond: (call: Call) => Response) => {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const call = {
        path: requestUrl(input),
        method: init?.method ?? 'GET',
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      };
      calls.push(call);
      return Promise.resolve(respond(call));
    })
  );
  return calls;
};

afterEach(() => vi.unstubAllGlobals());

describe('authClient writes', () => {
  it('posts the change-password body with revokeOtherSessions', async () => {
    const calls = stubFetch(() => json({}));
    await authClient.changePassword({
      currentPassword: 'old-pass',
      newPassword: 'new-pass-1',
      revokeOtherSessions: true,
    });
    expect(calls).toEqual([
      {
        path: '/api/auth/change-password',
        method: 'POST',
        body: { currentPassword: 'old-pass', newPassword: 'new-pass-1', revokeOtherSessions: true },
      },
    ]);
  });

  it('sends the new email with a callback to the account page', async () => {
    const calls = stubFetch(() => json({ status: true }));
    await authClient.changeEmail('new@example.com');
    expect(calls[0]?.path).toBe('/api/auth/change-email');
    expect(calls[0]?.body).toEqual({
      newEmail: 'new@example.com',
      callbackURL: `${window.location.origin}/account`,
    });
  });

  it('updates the name, revokes one session or all others, and deletes the user', async () => {
    const calls = stubFetch(() => json({ status: true }));
    await authClient.updateName('Test Member');
    await authClient.revokeSession('token-1');
    await authClient.revokeOtherSessions();
    await authClient.deleteUser();
    expect(calls.map(({ path, body }) => [path, body])).toEqual([
      ['/api/auth/update-user', { name: 'Test Member' }],
      ['/api/auth/revoke-session', { token: 'token-1' }],
      ['/api/auth/revoke-other-sessions', {}],
      ['/api/auth/delete-user', {}],
    ]);
  });

  it('requests the reset email with the app reset route and sets a new password with the token', async () => {
    const calls = stubFetch(() => json({}));
    await authClient.requestPasswordReset({
      email: 'a@example.com',
      redirectTo: 'http://localhost/reset',
    });
    await authClient.resetPassword({ newPassword: 'new-pass-1', token: 'reset-token' });
    expect(calls.map(({ path, body }) => [path, body])).toEqual([
      [
        '/api/auth/request-password-reset',
        { email: 'a@example.com', redirectTo: 'http://localhost/reset' },
      ],
      ['/api/auth/reset-password', { newPassword: 'new-pass-1', token: 'reset-token' }],
    ]);
  });

  it('unlinks an account by provider and id', async () => {
    const calls = stubFetch(() => json({ status: true }));
    await authClient.unlinkAccount({ id: 'acct-1', providerId: 'google', updatedAt: '2026-01-01' });
    expect(calls[0]?.body).toEqual({ providerId: 'google', accountId: 'acct-1' });
  });

  it('sends the browser to the link-social url', async () => {
    stubFetch(() => json({ url: 'https://accounts.example.test/auth', redirect: true }));
    const assign = vi.fn<(url: string) => void>();
    vi.stubGlobal('location', { origin: 'http://localhost', assign });
    await authClient.linkGoogle('/account');
    expect(assign).toHaveBeenCalledWith('https://accounts.example.test/auth');
  });

  it('throws an AuthError carrying the status and Better Auth code', async () => {
    stubFetch(() => json({ code: 'INVALID_PASSWORD', message: 'x' }, { status: 400 }));
    const failure = await authClient
      .changePassword({ currentPassword: 'a', newPassword: 'b', revokeOtherSessions: false })
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AuthError);
    expect(failure).toMatchObject({ status: 400, code: 'INVALID_PASSWORD' });
  });
});

describe('authClient reads', () => {
  it('parses the session list and the linked accounts', async () => {
    stubFetch(({ path }) =>
      path.endsWith('/list-sessions')
        ? json([
            { id: 's1', token: 't1', updatedAt: '2026-01-01T00:00:00Z', userAgent: null, extra: 1 },
          ])
        : json([{ id: 'a1', providerId: 'credential', updatedAt: '2026-01-02T00:00:00Z' }])
    );
    expect(await authClient.listSessions()).toEqual([
      { id: 's1', token: 't1', updatedAt: '2026-01-01T00:00:00Z', userAgent: null },
    ]);
    expect(await authClient.listAccounts()).toEqual([
      { id: 'a1', providerId: 'credential', updatedAt: '2026-01-02T00:00:00Z' },
    ]);
  });

  it('rejects a list that does not match the schema', async () => {
    stubFetch(() => json([{ nope: true }]));
    await expect(authClient.listSessions()).rejects.toBeInstanceOf(Error);
  });
});

describe('fetchSession', () => {
  it('returns the user, the API jwt and the session token', async () => {
    stubFetch(() =>
      json(
        { user: { id: 'u1', email: 'a@b.c', name: 'A' }, session: { token: 'tok' } },
        { headers: { 'set-auth-jwt': 'jwt-value' } }
      )
    );
    expect(await fetchSession()).toEqual({
      user: { id: 'u1', email: 'a@b.c', name: 'A' },
      jwt: 'jwt-value',
      sessionToken: 'tok',
    });
  });

  it('is signed out when the body has no user', async () => {
    stubFetch(() => json(null));
    expect(await fetchSession()).toEqual({ user: null, jwt: null, sessionToken: null });
  });
});
