// Picks the request URL out of fetch's `RequestInfo | URL` first argument without calling
// `.toString()` on a `Request`, which would just give "[object Object]".
export const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

// A signed-in `get-session` response with a token valid for the next 10 minutes, for tests whose
// component calls `apiRequest` and so needs `getAuthToken()` to resolve.
export const sessionResponse = (): Response =>
  new Response(JSON.stringify({ user: { id: 'u1', email: 'a@b.c', name: 'A' } }), {
    headers: {
      'set-auth-jwt': `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }))}.s`,
    },
  });
