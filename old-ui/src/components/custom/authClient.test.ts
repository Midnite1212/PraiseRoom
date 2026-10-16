import { AxiosError, AxiosHeaders } from 'axios';

import { authClient, getAuthToken } from './authClient';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: { ...actual.default, create: () => ({ get, post }) } };
});

const USER = { id: 'u1', email: 'user@example.com', name: 'Test User' };

const httpError = (status: number, data: unknown) =>
  new AxiosError('failed', undefined, undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

describe('authClient', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('returns a session only when the user has an id, email, and name', async () => {
    get.mockResolvedValueOnce({ data: { user: USER }, headers: {} });
    expect((await authClient.getSession()).data).toEqual({ user: USER });

    for (const user of [{}, { ...USER, id: '' }, { id: 'u1', name: 'No Email' }, null]) {
      get.mockResolvedValueOnce({ data: { user }, headers: {} });
      expect((await authClient.getSession()).data).toBeNull();
    }
  });

  it('returns the JWT header only for a valid session', async () => {
    get.mockResolvedValueOnce({ data: { user: USER }, headers: { 'set-auth-jwt': 'jwt-1' } });
    expect(await getAuthToken()).toBe('jwt-1');

    get.mockResolvedValueOnce({ data: { user: {} }, headers: { 'set-auth-jwt': 'jwt-2' } });
    expect(await getAuthToken()).toBeNull();

    get.mockRejectedValueOnce(httpError(500, {}));
    expect(await getAuthToken()).toBeNull();
  });

  it('reports the status and Better Auth code, never the message', async () => {
    post.mockRejectedValueOnce(
      httpError(422, { code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', message: 'server text' })
    );
    const { error } = await authClient.signUp.email({
      name: 'A',
      email: 'a@example.com',
      password: 'password',
    });
    expect(error).toEqual({ status: 422, code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' });
  });
});
