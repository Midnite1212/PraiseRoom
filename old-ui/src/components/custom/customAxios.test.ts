import { AxiosAdapter, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthToken } from './authClient';
import {
  RESPONSE_CACHE_TTL_MS,
  authRequestInterceptor,
  clearAuthTokenCache,
  clearResponseCache,
  createCachingAdapter,
} from './customAxios';

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

const defaultValidateStatus = (status: number) => status >= 200 && status < 300;

const cacheConfig = (
  overrides: Partial<InternalAxiosRequestConfig> = {}
): InternalAxiosRequestConfig => ({
  headers: new AxiosHeaders(),
  method: 'get',
  url: '/api/songs/get',
  validateStatus: defaultValidateStatus,
  ...overrides,
});

const okResponse = (config: InternalAxiosRequestConfig, data: unknown): AxiosResponse => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

const createSend = () =>
  vi.fn<AxiosAdapter>(async (config) => okResponse(config, { items: [config.url] }));

describe('customAxios response cache', () => {
  afterEach(() => {
    clearResponseCache();
    vi.useRealTimers();
  });

  it('shares one request between identical GETs and hands each caller its own copy', async () => {
    const send = createSend();
    const adapter = createCachingAdapter(send, defaultValidateStatus);

    const [first, second] = await Promise.all([adapter(cacheConfig()), adapter(cacheConfig())]);

    expect(send).toHaveBeenCalledTimes(1);
    expect(second.data).toEqual(first.data);
    expect(second.data).not.toBe(first.data);
  });

  it('keys the cache by url, params, and Authorization header', async () => {
    const send = createSend();
    const adapter = createCachingAdapter(send, defaultValidateStatus);

    await adapter(cacheConfig());
    await adapter(cacheConfig({ params: { id: 'a' } }));
    await adapter(cacheConfig({ headers: new AxiosHeaders({ Authorization: 'Bearer other' }) }));
    await adapter(cacheConfig({ url: '/api/setlists/get' }));

    expect(send).toHaveBeenCalledTimes(4);
  });

  it('refetches once the TTL has passed', async () => {
    vi.useFakeTimers();
    const send = createSend();
    const adapter = createCachingAdapter(send, defaultValidateStatus);

    await adapter(cacheConfig());
    vi.advanceTimersByTime(RESPONSE_CACHE_TTL_MS);
    await adapter(cacheConfig());

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('clears the cache on any write', async () => {
    const send = createSend();
    const adapter = createCachingAdapter(send, defaultValidateStatus);

    await adapter(cacheConfig());
    await adapter(cacheConfig({ method: 'put', url: '/api/songs/update' }));
    await adapter(cacheConfig());

    expect(send).toHaveBeenCalledTimes(3);
  });

  it('does not cache a failed request', async () => {
    const send = vi
      .fn<AxiosAdapter>()
      .mockRejectedValueOnce(new Error('network'))
      .mockImplementation(async (config) => okResponse(config, []));
    const adapter = createCachingAdapter(send, defaultValidateStatus);

    await expect(adapter(cacheConfig())).rejects.toThrow('network');
    await adapter(cacheConfig());

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('bypasses the cache when the caller sets its own validateStatus', async () => {
    const send = createSend();
    const adapter = createCachingAdapter(send, defaultValidateStatus);
    const validateStatus = (status: number) => status === 200 || status === 404;

    await adapter(cacheConfig({ validateStatus }));
    await adapter(cacheConfig({ validateStatus }));

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('is cleared on sign-out with the token cache', async () => {
    const send = createSend();
    const adapter = createCachingAdapter(send, defaultValidateStatus);

    await adapter(cacheConfig());
    clearAuthTokenCache();
    await adapter(cacheConfig());

    expect(send).toHaveBeenCalledTimes(2);
  });
});
