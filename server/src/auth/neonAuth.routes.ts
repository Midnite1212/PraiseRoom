import { Request, Response, Router, raw } from 'express';
import { sendResponse } from '../utils/response';

export const AUTH_PATH_PREFIX = '/api/auth/';
export const AUTH_CALLBACK_PATH = '/api/auth-callback';
const LOGIN_PATH = '/login';
const MAX_AUTH_BODY = '1mb';
const NEON_COOKIE_PREFIX = '__Secure-neon-auth';
const VERIFIER_PARAM = 'neon_auth_session_verifier';
// Neon Auth still accepts the misspelled legacy name, so both count as an OAuth challenge.
const CHALLENGE_COOKIES = [
  `${NEON_COOKIE_PREFIX}.session_challenge`,
  `${NEON_COOKIE_PREFIX}.session_challange`,
];
const FORWARDED_REQUEST_HEADERS = ['authorization', 'content-type', 'referer', 'user-agent'];
const FORWARDED_RESPONSE_HEADERS = [
  'content-type',
  'date',
  'set-auth-jwt',
  'set-auth-token',
  'x-neon-ret-request-id',
];
// Lax so the session cookie survives the top-level redirect back from Google.
const COOKIE_ATTRIBUTES = ['HttpOnly', 'Secure', 'SameSite=Lax'];
const REPLACED_COOKIE_ATTRIBUTE = /^(httponly|secure|samesite|partitioned)(=|$)/i;

const readAuthBaseUrl = (): string | null =>
  process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, '') || null;

const requestOrigin = (req: Request): string => {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return `${forwardedProto || req.protocol}://${req.get('host') ?? 'localhost'}`;
};

const browserOrigin = (req: Request): string => {
  const origin = req.get('origin');
  if (origin) return origin;
  const referer = req.get('referer');
  if (referer && URL.canParse(referer)) return new URL(referer).origin;
  return requestOrigin(req);
};

export const neonCookies = (cookieHeader: string | undefined): string =>
  (cookieHeader ?? '')
    .split(';')
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(NEON_COOKIE_PREFIX))
    .join('; ');

export const toFirstPartyCookie = (setCookie: string): string =>
  [
    ...setCookie
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part !== '' && !REPLACED_COOKIE_ATTRIBUTE.test(part)),
    ...COOKIE_ATTRIBUTES,
  ].join('; ');

export const safeNextPath = (value: unknown): string =>
  typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : '/';

const fetchFromNeon = (
  baseUrl: string,
  req: Request,
  path: string,
  method: string
): Promise<globalThis.Response> => {
  const url = new URL(`${baseUrl}/${path}`);
  url.search = new URL(req.originalUrl, 'http://localhost').search;
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('origin', browserOrigin(req));
  headers.set('cookie', neonCookies(req.headers.cookie));
  const body: unknown = req.body;
  const hasBody = method !== 'GET' && method !== 'HEAD' && Buffer.isBuffer(body) && body.length > 0;
  return fetch(url, { method, headers, ...(hasBody ? { body } : {}) });
};

const setFirstPartyCookies = (res: Response, response: globalThis.Response): void => {
  const cookies = response.headers.getSetCookie().map(toFirstPartyCookie);
  if (cookies.length > 0) res.append('Set-Cookie', cookies);
};

const logUnreachable = (error: unknown): void => {
  console.error('Neon Auth is unreachable:', error instanceof Error ? error.message : error);
};

const proxyAuth = async (req: Request, res: Response): Promise<void> => {
  const baseUrl = readAuthBaseUrl();
  if (!baseUrl) {
    sendResponse(res, 503, 'Sign-in is not configured');
    return;
  }
  try {
    const path = req.path.slice(AUTH_PATH_PREFIX.length);
    const response = await fetchFromNeon(baseUrl, req, path, req.method);
    const body = Buffer.from(await response.arrayBuffer());
    res.status(response.status);
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = response.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    setFirstPartyCookies(res, response);
    res.send(body);
  } catch (error: unknown) {
    logUnreachable(error);
    sendResponse(res, 502, 'Sign-in is unavailable');
  }
};

// Google returns here with a one-time verifier, which Neon Auth swaps for session cookies.
const finishSignIn = async (req: Request, res: Response): Promise<void> => {
  const baseUrl = readAuthBaseUrl();
  const verifier = req.query[VERIFIER_PARAM];
  const cookies = neonCookies(req.headers.cookie);
  const hasChallenge = CHALLENGE_COOKIES.some((name) => cookies.includes(`${name}=`));
  if (!baseUrl || typeof verifier !== 'string' || !hasChallenge) {
    res.redirect(302, safeNextPath(req.query.next));
    return;
  }
  try {
    const response = await fetchFromNeon(baseUrl, req, 'get-session', 'GET');
    if (!response.ok) {
      res.redirect(302, LOGIN_PATH);
      return;
    }
    setFirstPartyCookies(res, response);
    res.redirect(302, safeNextPath(req.query.next));
  } catch (error: unknown) {
    logUnreachable(error);
    res.redirect(302, LOGIN_PATH);
  }
};

export const createAuthRouter = (): Router => {
  const router = Router();
  router.all(`${AUTH_PATH_PREFIX}*`, raw({ type: '*/*', limit: MAX_AUTH_BODY }), proxyAuth);
  router.get(AUTH_CALLBACK_PATH, finishSignIn);
  return router;
};
