import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { RequestHandler } from 'express';

import { ownershipRepository } from '../db/repositories/ownership.repository';
import { callHandler, createRequest, createResponse } from '../testing/http';
import { TestAuthServer, startTestAuthServer } from '../testing/neonAuth';
import { createPermissionMiddleware } from './permissionMiddleware';
import { ROUTE_PERMISSIONS } from './permissions.config';

const USER_ID = '860dc360-609f-4b7d-9e70-ec93fe6414d3';

let auth: TestAuthServer;

const tokenFor = (): Promise<string> =>
  auth.sign({ email: 'user@example.com', name: 'Test User', sub: USER_ID });

const storeAccessType = (accessType: string | null) =>
  mock.method(ownershipRepository, 'findAccessType', async () => accessType);

const userWith = (accessType: string) => ({
  accessType,
  emailAddress: 'user@example.com',
  id: USER_ID,
  name: 'Test User',
});

const middlewareAt = (method: string, path: string, index: number): RequestHandler => {
  const handler = createPermissionMiddleware(method, path)[index];
  assert.ok(handler, `${method} ${path} has no middleware at ${index}`);
  return handler;
};

const run = async (handler: RequestHandler, headers: Record<string, string> = {}) => {
  const req = createRequest({ headers });
  const res = createResponse();
  const next = await callHandler(handler, req, res);
  return { next, req, res };
};

describe('permissionMiddleware', () => {
  const originalUrl = process.env.NEON_AUTH_BASE_URL;

  before(async () => {
    auth = await startTestAuthServer();
    process.env.NEON_AUTH_BASE_URL = auth.url;
  });

  after(async () => {
    await auth.close();
    if (originalUrl === undefined) delete process.env.NEON_AUTH_BASE_URL;
    else process.env.NEON_AUTH_BASE_URL = originalUrl;
  });

  beforeEach(() => {
    mock.method(console, 'warn', () => undefined);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('createPermissionMiddleware', () => {
    const requireAuth = () => middlewareAt('POST', '/api/ownerships/create', 0);
    const optionalAuth = () => middlewareAt('GET', '/api/setlists/get', 0);

    it('builds the expected chain for every configured route', () => {
      const expected: Record<string, number> = {
        'GET /api/groups/get': 1,
        'GET /api/ownerships/get': 1,
        'GET /api/setlists/get': 1,
        'GET /api/songs/get': 0,
        'GET /api/songs/get-view': 0,
        'GET /api/songs/import/metadata': 2,
        'GET /api/songs/import/search': 2,
        'GET /api/songs/keys': 0,
        'GET /api/songs/search': 0,
        'POST /api/groups/create': 1,
        'POST /api/ownerships/create': 1,
        'POST /api/setlists/create': 1,
        'POST /api/setlists/duplicate': 1,
        'POST /api/songs/create': 2,
        'POST /api/songs/import/convert': 2,
        'POST /api/songs/import/fetch': 2,
        'PUT /api/groups/delete': 1,
        'PUT /api/groups/invite': 1,
        'PUT /api/groups/join': 1,
        'PUT /api/groups/members': 1,
        'PUT /api/groups/update': 1,
        'PUT /api/ownerships/delete': 1,
        'PUT /api/ownerships/update': 1,
        'PUT /api/setlists/delete': 1,
        'PUT /api/setlists/update': 1,
        'PUT /api/songs/delete': 2,
        'PUT /api/songs/update': 2,
      };
      assert.deepEqual(Object.keys(ROUTE_PERMISSIONS).sort(), Object.keys(expected).sort());
      for (const [routeKey, length] of Object.entries(expected)) {
        const [method, path] = routeKey.split(' ');
        const chain = createPermissionMiddleware(method ?? '', path ?? '');
        assert.equal(chain.length, length, routeKey);
        if (routeKey === 'GET /api/setlists/get') assert.equal(chain[0], optionalAuth());
        else if (length > 0) assert.equal(chain[0], requireAuth(), routeKey);
      }
    });

    it('upper-cases the method before looking up the route', () => {
      assert.equal(middlewareAt('get', '/api/setlists/get', 0), optionalAuth());
    });

    it('falls back to requireAuth and warns when a route has no config', () => {
      const warn = mock.method(console, 'warn', () => undefined);
      const chain = createPermissionMiddleware('GET', '/unknown/route');
      assert.deepEqual(chain, [requireAuth()]);
      assert.equal(warn.mock.callCount(), 1);
      assert.equal(
        warn.mock.calls[0]?.arguments[0],
        'No permission config found for route: GET /unknown/route'
      );
    });
  });

  describe('requireAuth', () => {
    const requireAuth = () => middlewareAt('POST', '/api/ownerships/create', 0);

    it('rejects a request with no authorization header', async () => {
      const { next, req, res } = await run(requireAuth());
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, {
        error: 'No authorization header provided',
        message: 'Unauthorized',
      });
      assert.equal(next.mock.callCount(), 0);
      assert.equal(req.user, undefined);
    });

    it('treats an empty header as missing', async () => {
      const { res } = await run(requireAuth(), { authorization: '' });
      assert.deepEqual(res.body, {
        error: 'No authorization header provided',
        message: 'Unauthorized',
      });
    });

    it('rejects malformed authorization headers', async () => {
      const token = await tokenFor();
      for (const header of [
        token,
        `Token ${token}`,
        `bearer ${token}`,
        'Bearer',
        'Bearer ',
        `Bearer  ${token}`,
        `Bearer ${token} extra`,
      ]) {
        const { next, res } = await run(requireAuth(), { authorization: header });
        assert.equal(res.statusCode, 401, header);
        assert.deepEqual(res.body, {
          error: 'Invalid authorization header format. Expected: Bearer <token>',
          message: 'Unauthorized',
        });
        assert.equal(next.mock.callCount(), 0);
      }
    });

    it('rejects a bearer token that does not verify', async () => {
      const { next, req, res } = await run(requireAuth(), { authorization: 'Bearer garbage' });
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { error: 'Invalid or expired token', message: 'Unauthorized' });
      assert.equal(next.mock.callCount(), 0);
      assert.equal(req.user, undefined);
    });

    it('sets req.user with the stored access type and calls next for a valid token', async () => {
      const lookup = storeAccessType('editor');
      const { next, req, res } = await run(requireAuth(), {
        authorization: `Bearer ${await tokenFor()}`,
      });
      assert.deepEqual(req.user, userWith('editor'));
      assert.deepEqual(lookup.mock.calls[0]?.arguments, [USER_ID]);
      assert.equal(next.mock.callCount(), 1);
      assert.deepEqual(next.mock.calls[0]?.arguments, []);
      assert.equal(res.statusCode, undefined);
    });

    it('defaults to member when the caller has no ownership yet', async () => {
      storeAccessType(null);
      const { req } = await run(requireAuth(), { authorization: `Bearer ${await tokenFor()}` });
      assert.equal(req.user?.accessType, 'member');
    });

    it('passes a failed access-type lookup to next', async () => {
      const failure = new Error('database down');
      mock.method(ownershipRepository, 'findAccessType', async () => {
        throw failure;
      });
      const { next, req, res } = await run(requireAuth(), {
        authorization: `Bearer ${await tokenFor()}`,
      });
      assert.deepEqual(next.mock.calls[0]?.arguments, [failure]);
      assert.equal(req.user, undefined);
      assert.equal(res.statusCode, undefined);
    });
  });

  describe('requireAccessType', () => {
    const requireAccessType = () => middlewareAt('POST', '/api/songs/create', 1);

    it('allows each listed access type', async () => {
      for (const accessType of ['editor', 'admin']) {
        const req = createRequest({ user: { accessType, id: USER_ID } });
        const res = createResponse();
        const next = await callHandler(requireAccessType(), req, res);
        assert.equal(next.mock.callCount(), 1, accessType);
        assert.equal(res.statusCode, undefined);
      }
    });

    it('rejects unlisted access types with a 403 that names none of them', async () => {
      for (const accessType of ['member', 'ministry', 'Admin', 'editors', '']) {
        const req = createRequest({ user: { accessType, id: USER_ID } });
        const res = createResponse();
        const next = await callHandler(requireAccessType(), req, res);
        assert.equal(res.statusCode, 403, accessType);
        assert.deepEqual(res.body, { error: 'Access denied', message: 'Forbidden' });
        assert.doesNotMatch(JSON.stringify(res.body), /editor|admin/);
        assert.equal(next.mock.callCount(), 0);
      }
    });

    it('rejects a request with no req.user', async () => {
      const { next, res } = await run(requireAccessType());
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { error: 'No user information found', message: 'Unauthorized' });
      assert.equal(next.mock.callCount(), 0);
    });

    it('runs after requireAuth in the song write chains', async () => {
      storeAccessType('member');
      const chain = createPermissionMiddleware('PUT', '/api/songs/update');
      const req = createRequest({ headers: { authorization: `Bearer ${await tokenFor()}` } });
      const res = createResponse();
      for (const handler of chain) {
        const next = await callHandler(handler, req, res);
        if (next.mock.callCount() === 0) break;
      }
      assert.equal(res.statusCode, 403);
    });
  });

  describe('optionalAuth', () => {
    const optionalAuth = () => middlewareAt('GET', '/api/setlists/get', 0);

    it('continues anonymously without a token', async () => {
      const { next, req, res } = await run(optionalAuth());
      assert.equal(next.mock.callCount(), 1);
      assert.equal(req.user, undefined);
      assert.equal(res.statusCode, undefined);
    });

    it('continues anonymously with a malformed header or bad token', async () => {
      for (const header of ['garbage', `bearer ${await tokenFor()}`, 'Bearer garbage']) {
        const { next, req, res } = await run(optionalAuth(), { authorization: header });
        assert.equal(next.mock.callCount(), 1, header);
        assert.equal(req.user, undefined);
        assert.equal(res.statusCode, undefined);
      }
    });

    it('sets req.user for a valid token', async () => {
      storeAccessType('admin');
      const { next, req } = await run(optionalAuth(), {
        authorization: `Bearer ${await tokenFor()}`,
      });
      assert.equal(next.mock.callCount(), 1);
      assert.deepEqual(req.user, userWith('admin'));
    });

    it('passes a failed access-type lookup to next', async () => {
      const failure = new Error('database down');
      mock.method(ownershipRepository, 'findAccessType', async () => {
        throw failure;
      });
      const { next } = await run(optionalAuth(), { authorization: `Bearer ${await tokenFor()}` });
      assert.deepEqual(next.mock.calls[0]?.arguments, [failure]);
    });
  });
});
