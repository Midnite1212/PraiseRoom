import type { z } from 'zod';

import { fetchSession } from './auth-client';

const TOKEN_REFRESH_SKEW_MS = 60_000;

type CachedToken = { token: string; expiresAt: number };

let cachedToken: CachedToken | null = null;

export const clearAuthToken = (): void => {
  cachedToken = null;
};

const decodeExpiryMs = (token: string): number | null => {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }
  try {
    const decoded: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const exp =
      typeof decoded === 'object' && decoded !== null ? Reflect.get(decoded, 'exp') : undefined;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now()) {
    return cachedToken.token;
  }
  const { user, jwt } = await fetchSession().catch(() => ({ user: null, jwt: null }));
  if (!user || !jwt) {
    cachedToken = null;
    return null;
  }
  cachedToken = {
    token: jwt,
    expiresAt: decodeExpiryMs(jwt) ?? Date.now() + TOKEN_REFRESH_SKEW_MS,
  };
  return jwt;
};

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | readonly string[] | undefined;

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
};

const toSearchParams = (query: Record<string, QueryValue>): URLSearchParams => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, String(value));
    }
  }
  return params;
};

// Every response is parsed with `schema`, so callers get validated data, never `unknown` or `any`.
export const apiRequest = async <TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  { method = 'GET', query, body, signal }: ApiRequestOptions = {}
): Promise<z.output<TSchema>> => {
  const token = await getAuthToken();
  const search = query ? `?${toSearchParams(query).toString()}` : '';
  const response = await fetch(`${path}${search}`, {
    method,
    signal,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return schema.parse(await response.json());
};
