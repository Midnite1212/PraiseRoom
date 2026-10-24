import { z } from 'zod';

const AUTH_BASE = '/api/auth';

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

const sessionSchema = z.object({
  user: sessionUserSchema,
  session: z.object({ token: z.string().min(1) }).optional(),
});
const errorBodySchema = z.object({ code: z.string() });
const socialSignInSchema = z.object({ url: z.string().optional() });

export const authSessionSchema = z.object({
  id: z.string().min(1),
  token: z.string().min(1),
  updatedAt: z.string(),
  userAgent: z.string().nullish(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;

export const authAccountSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  updatedAt: z.string(),
});

export type AuthAccount = z.infer<typeof authAccountSchema>;

// `code` is Better Auth's machine-readable error code; never render the server's message text.
export class AuthError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string
  ) {
    super(code ?? `Auth request failed with status ${status}`);
    this.name = 'AuthError';
  }
}

const readErrorCode = async (response: Response): Promise<string | undefined> => {
  const parsed = errorBodySchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data.code : undefined;
};

const get = async (path: string): Promise<unknown> => {
  const response = await fetch(`${AUTH_BASE}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new AuthError(response.status, await readErrorCode(response));
  }
  return response.json().catch(() => null);
};

const post = async (path: string, body: unknown): Promise<unknown> => {
  const response = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new AuthError(response.status, await readErrorCode(response));
  }
  return response.json().catch(() => null);
};

export type FetchedSession = {
  user: SessionUser | null;
  jwt: string | null;
  sessionToken: string | null;
};

// Neon Auth returns the API JWT in the `set-auth-jwt` header of get-session; a cached response
// would carry an expired one.
export const fetchSession = async (): Promise<FetchedSession> => {
  const response = await fetch(`${AUTH_BASE}/get-session`, { cache: 'no-store' });
  if (!response.ok) {
    throw new AuthError(response.status, await readErrorCode(response));
  }
  const parsed = sessionSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    return { user: null, jwt: null, sessionToken: null };
  }
  return {
    user: parsed.data.user,
    jwt: response.headers.get('set-auth-jwt') || null,
    sessionToken: parsed.data.session?.token ?? null,
  };
};

export const authClient = {
  signInWithEmail: (body: { email: string; password: string }) => post('/sign-in/email', body),
  signInWithGoogle: async (nextPath: string): Promise<void> => {
    const callbackURL = `${window.location.origin}/api/auth-callback?next=${encodeURIComponent(nextPath)}`;
    const parsed = socialSignInSchema.parse(
      await post('/sign-in/social', { provider: 'google', callbackURL })
    );
    if (parsed.url) {
      window.location.assign(parsed.url);
    }
  },
  signUp: (body: { name: string; email: string; password: string }) => post('/sign-up/email', body),
  requestPasswordReset: (body: { email: string; redirectTo: string }) =>
    post('/request-password-reset', body),
  resetPassword: (body: { newPassword: string; token: string }) => post('/reset-password', body),
  sendVerificationEmail: (email: string) =>
    post('/send-verification-email', { email, callbackURL: `${window.location.origin}/login` }),
  signOut: () => post('/sign-out', {}),
  changePassword: (body: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions: boolean;
  }) => post('/change-password', body),
  changeEmail: (newEmail: string) =>
    post('/change-email', { newEmail, callbackURL: `${window.location.origin}/account` }),
  updateName: (name: string) => post('/update-user', { name }),
  listSessions: async (): Promise<AuthSession[]> =>
    z.array(authSessionSchema).parse(await get('/list-sessions')),
  revokeSession: (token: string) => post('/revoke-session', { token }),
  revokeOtherSessions: () => post('/revoke-other-sessions', {}),
  listAccounts: async (): Promise<AuthAccount[]> =>
    z.array(authAccountSchema).parse(await get('/list-accounts')),
  linkGoogle: async (nextPath: string): Promise<void> => {
    const callbackURL = `${window.location.origin}/api/auth-callback?next=${encodeURIComponent(nextPath)}`;
    const parsed = socialSignInSchema.parse(
      await post('/link-social', { provider: 'google', callbackURL })
    );
    if (parsed.url) {
      window.location.assign(parsed.url);
    }
  },
  unlinkAccount: (account: AuthAccount) =>
    post('/unlink-account', { providerId: account.providerId, accountId: account.id }),
  deleteUser: () => post('/delete-user', {}),
};
