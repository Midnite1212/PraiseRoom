import axios, { InternalAxiosRequestConfig } from 'axios';
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

export const customAxios = axios.create();

customAxios.interceptors.request.use(authRequestInterceptor);
