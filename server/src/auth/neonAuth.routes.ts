import {
  DEFAULT_AUTH_SKIP_ROUTES,
  handleAuthProxyRequest,
  processAuthMiddleware,
  validateCookieConfig,
} from '@neondatabase/auth/server';
import { NextFunction, Request, Response, Router, raw } from 'express';
import { sendResponse } from '../utils/response';

export const AUTH_PATH_PREFIX = '/api/auth/';
export const AUTH_CALLBACK_PATH = '/api/auth-callback';
const LOGIN_PATH = '/login';
const MAX_AUTH_BODY = '1mb';
// Lax so the session cookie survives the top-level redirect back from Google.
const SAME_SITE = 'lax';
// fetch() has already decoded the body, so its framing headers no longer apply.
const UNFORWARDED_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'set-cookie',
  'transfer-encoding',
]);

type AuthConfig = { baseUrl: string; cookieSecret: string };

const readAuthConfig = (): AuthConfig | null => {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !cookieSecret) return null;
  try {
    validateCookieConfig({ secret: cookieSecret });
  } catch (error: unknown) {
    console.error('Neon Auth is disabled:', error instanceof Error ? error.message : error);
    return null;
  }
  return { baseUrl, cookieSecret };
};

const requestOrigin = (req: Request): string => {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return `${forwardedProto || req.protocol}://${req.get('host') ?? 'localhost'}`;
};

export const toFetchRequest = (req: Request): globalThis.Request => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  const body: unknown = req.body;
  const init: RequestInit & { duplex?: 'half' } = { method: req.method, headers };
  if (Buffer.isBuffer(body) && body.length > 0) {
    init.body = body;
    init.duplex = 'half';
  }
  return new globalThis.Request(new URL(req.originalUrl, requestOrigin(req)), init);
};

export const writeFetchResponse = async (
  res: Response,
  response: globalThis.Response
): Promise<void> => {
  res.status(response.status);
  response.headers.forEach((value, name) => {
    if (!UNFORWARDED_HEADERS.has(name)) res.setHeader(name, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);
  res.send(Buffer.from(await response.arrayBuffer()));
};

export const safeNextPath = (value: unknown): string =>
  typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : '/';

const proxyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const config = readAuthConfig();
  if (!config) {
    sendResponse(res, 503, 'Sign-in is not configured');
    return;
  }
  try {
    const response = await handleAuthProxyRequest({
      ...config,
      request: toFetchRequest(req),
      path: req.path.slice(AUTH_PATH_PREFIX.length),
      sameSite: SAME_SITE,
    });
    await writeFetchResponse(res, response);
  } catch (error: unknown) {
    next(error);
  }
};

// Google returns here; the toolkit swaps the one-time verifier for the session cookies.
const finishSignIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const config = readAuthConfig();
  if (!config) {
    res.redirect(302, LOGIN_PATH);
    return;
  }
  try {
    const result = await processAuthMiddleware({
      ...config,
      request: toFetchRequest(req),
      pathname: AUTH_CALLBACK_PATH,
      skipRoutes: [...DEFAULT_AUTH_SKIP_ROUTES, AUTH_CALLBACK_PATH],
      loginUrl: LOGIN_PATH,
      sameSite: SAME_SITE,
    });
    if (result.cookies && result.cookies.length > 0) res.append('Set-Cookie', result.cookies);
    const target =
      result.action === 'allow' ? safeNextPath(req.query.next) : result.redirectUrl.toString();
    res.redirect(302, target);
  } catch (error: unknown) {
    next(error);
  }
};

export const createAuthRouter = (): Router => {
  const router = Router();
  router.all(`${AUTH_PATH_PREFIX}*`, raw({ type: '*/*', limit: MAX_AUTH_BODY }), proxyAuth);
  router.get(AUTH_CALLBACK_PATH, finishSignIn);
  return router;
};
