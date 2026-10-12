import { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthToken } from './authClient';
import { authRequestInterceptor, clearAuthTokenCache } from './customAxios';

vi.mock('./authClient', () => ({
  getAuthToken: vi.fn(),
}));

const encodeToken = (exp: number): string => {
  const header = btoa(JSON.stringify({ alg: 'EdDSA' }));
  const payload = btoa(JSON.stringify({ exp }));
  return `${header}.${payload}.signature`;
};

const requestConfig = (): InternalAxiosRequestConfig => ({ headers: new AxiosHeaders() });

describe('customAxios token cache', () => {
  afterEach(() => {
    clearAuthTokenCache();
    vi.mocked(getAuthToken).mockReset();
  });

  it('skips the Authorization header when signed out', async () => {
    vi.mocked(getAuthToken).mockResolvedValue(null);

    const config = await authRequestInterceptor(requestConfig());

    expect(config.headers.has('Authorization')).toBe(false);
  });

  it('reuses the cached token without calling the SDK again before it expires', async () => {
    const token = encodeToken(Math.floor(Date.now() / 1000) + 600);
    vi.mocked(getAuthToken).mockResolvedValue(token);

    const first = await authRequestInterceptor(requestConfig());
    const second = await authRequestInterceptor(requestConfig());

    expect(first.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(second.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(getAuthToken).toHaveBeenCalledTimes(1);
  });

  it('refetches once the cached token is near its expiry', async () => {
    const expiringToken = encodeToken(Math.floor(Date.now() / 1000) + 30);
    const freshToken = encodeToken(Math.floor(Date.now() / 1000) + 600);
    vi.mocked(getAuthToken).mockResolvedValueOnce(expiringToken).mockResolvedValueOnce(freshToken);

    const first = await authRequestInterceptor(requestConfig());
    const second = await authRequestInterceptor(requestConfig());

    expect(first.headers.get('Authorization')).toBe(`Bearer ${expiringToken}`);
    expect(second.headers.get('Authorization')).toBe(`Bearer ${freshToken}`);
    expect(getAuthToken).toHaveBeenCalledTimes(2);
  });
});
