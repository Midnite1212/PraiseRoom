import axios, { AxiosResponse, isAxiosError } from 'axios';

// `code` is Better Auth's machine-readable error code; its message text is never shown.
export type AuthError = { status: number; code?: string };
export type AuthResult<T> = { data: T | null; error: AuthError | null };
export type SessionUser = { id: string; email: string; name: string };
export type AuthSession = { user: SessionUser };

type SocialSignIn = { url?: string; redirect?: boolean };

// Not customAxios: its interceptor asks this client for a token, which would recurse.
const authApi = axios.create({ baseURL: '/api/auth' });

const toAuthError = (error: unknown): AuthError => {
  if (!isAxiosError(error)) return { status: 0 };
  const body: unknown = error.response?.data;
  const code = typeof body === 'object' && body !== null ? Reflect.get(body, 'code') : undefined;
  return {
    status: error.response?.status ?? 0,
    ...(typeof code === 'string' ? { code } : {}),
  };
};

const request = async <T>(send: () => Promise<AxiosResponse<T>>): Promise<AuthResult<T>> => {
  try {
    const { data } = await send();
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: toAuthError(error) };
  }
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value !== '';

const isSessionUser = (value: unknown): value is SessionUser =>
  typeof value === 'object' &&
  value !== null &&
  isNonEmptyString(Reflect.get(value, 'id')) &&
  isNonEmptyString(Reflect.get(value, 'email')) &&
  typeof Reflect.get(value, 'name') === 'string';

const isSession = (value: unknown): value is AuthSession =>
  typeof value === 'object' && value !== null && isSessionUser(Reflect.get(value, 'user'));

const fetchSession = async (): Promise<{ session: AuthSession | null; jwt: string | null }> => {
  const { data, headers } = await authApi.get<unknown>('/get-session');
  const jwt: unknown = headers['set-auth-jwt'];
  return {
    session: isSession(data) ? data : null,
    jwt: typeof jwt === 'string' && jwt !== '' ? jwt : null,
  };
};

export const authClient = {
  getSession: (): Promise<AuthResult<AuthSession>> =>
    fetchSession().then(
      ({ session }) => ({ data: session, error: null }),
      (error: unknown) => ({ data: null, error: toAuthError(error) })
    ),
  signIn: {
    email: (body: { email: string; password: string }) =>
      request(() => authApi.post('/sign-in/email', body)),
    social: async (body: { provider: 'google'; callbackURL: string }) => {
      const result = await request(() => authApi.post<SocialSignIn>('/sign-in/social', body));
      if (result.data?.url) window.location.assign(result.data.url);
      return result;
    },
  },
  signUp: {
    email: (body: { name: string; email: string; password: string }) =>
      request(() => authApi.post('/sign-up/email', body)),
  },
  requestPasswordReset: (body: { email: string; redirectTo: string }) =>
    request(() => authApi.post('/request-password-reset', body)),
  resetPassword: (body: { newPassword: string; token: string }) =>
    request(() => authApi.post('/reset-password', body)),
  signOut: () => request(() => authApi.post('/sign-out', {})),
};

// Neon Auth returns the API JWT in this header on get-session; null when signed out.
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { session, jwt } = await fetchSession();
    return session ? jwt : null;
  } catch {
    return null;
  }
};
