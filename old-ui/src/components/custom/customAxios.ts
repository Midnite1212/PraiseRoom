import axios, {
  AxiosAdapter,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { getAuthToken } from './authClient';

// Tokens live 15 minutes; refresh a minute early so a request never races the expiry.
const TOKEN_REFRESH_SKEW_MS = 60_000;

type JwtPayload = { exp?: number };

const isJwtPayload = (value: unknown): value is JwtPayload =>
  typeof value === 'object' && value !== null;

const decodeExpiryMs = (token: string): number | null => {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }
  try {
    const decoded: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return isJwtPayload(decoded) && typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

type CachedToken = { token: string; expiresAt: number };

let cachedToken: CachedToken | null = null;

export const clearAuthTokenCache = (): void => {
  cachedToken = null;
  clearResponseCache();
};

export const resolveAuthToken = async (): Promise<string | null> => {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now()) {
    return cachedToken.token;
  }
  const token = await getAuthToken();
  if (!token) {
    cachedToken = null;
    return null;
  }
  const expiresAt = decodeExpiryMs(token) ?? Date.now() + TOKEN_REFRESH_SKEW_MS;
  cachedToken = { token, expiresAt };
  return token;
};

export const authRequestInterceptor = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const token = await resolveAuthToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
};

export const RESPONSE_CACHE_TTL_MS = 30_000;

type CachedResponse = { promise: Promise<AxiosResponse>; storedAt: number };

const responseCache = new Map<string, CachedResponse>();

export const clearResponseCache = (): void => {
  responseCache.clear();
};

const toCacheKey = (config: InternalAxiosRequestConfig): string =>
  JSON.stringify([config.url, config.params ?? null, config.headers.get('Authorization') ?? null]);

const isSuccess = (status: number): boolean => status >= 200 && status < 300;

// Any write clears the cache so a tab never reads data older than its own last change.
export const createCachingAdapter = (
  send: AxiosAdapter,
  defaultValidateStatus: AxiosRequestConfig['validateStatus']
): AxiosAdapter => {
  return (config) => {
    if (config.method !== 'get') {
      clearResponseCache();
      return send(config);
    }
    if (config.validateStatus !== defaultValidateStatus) {
      return send(config);
    }
    const key = toCacheKey(config);
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.storedAt < RESPONSE_CACHE_TTL_MS) {
      return cached.promise.then((response) => ({
        ...response,
        config,
        data: structuredClone(response.data),
      }));
    }
    const promise = send(config);
    const entry = { promise, storedAt: Date.now() };
    responseCache.set(key, entry);
    promise.then(
      (response) => {
        if (!isSuccess(response.status) && responseCache.get(key) === entry) {
          responseCache.delete(key);
        }
      },
      () => {
        if (responseCache.get(key) === entry) {
          responseCache.delete(key);
        }
      }
    );
    return promise.then((response) => ({ ...response, data: structuredClone(response.data) }));
  };
};

export const customAxios = axios.create();

customAxios.defaults.adapter = createCachingAdapter(
  axios.getAdapter(customAxios.defaults.adapter),
  customAxios.defaults.validateStatus
);
customAxios.interceptors.request.use(authRequestInterceptor);
