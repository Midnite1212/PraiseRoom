import { z } from 'zod';

const AUTH_BASE = '/api/auth';

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

const sessionSchema = z.object({ user: sessionUserSchema });
const errorBodySchema = z.object({ code: z.string() });
const socialSignInSchema = z.object({ url: z.string().optional() });

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

export type FetchedSession = { user: SessionUser | null; jwt: string | null };

// Neon Auth returns the API JWT in the `set-auth-jwt` header of get-session.
export const fetchSession = async (): Promise<FetchedSession> => {
  const response = await fetch(`${AUTH_BASE}/get-session`);
  if (!response.ok) {
    throw new AuthError(response.status, await readErrorCode(response));
  }
  const parsed = sessionSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    return { user: null, jwt: null };
  }
  return { user: parsed.data.user, jwt: response.headers.get('set-auth-jwt') || null };
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
  signOut: () => post('/sign-out', {}),
};
