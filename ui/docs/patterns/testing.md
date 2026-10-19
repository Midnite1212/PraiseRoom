# Testing

Reference: `src/lib/api-client.test.ts`, `src/features/songs/songs-table.test.tsx`, `src/i18n/locales.test.ts`.

- **Vitest + Testing Library on jsdom.** `src/test/setup.ts` loads jest-dom matchers and i18n (English), and cleans up after each test.
- **Test pure logic** in `lib/` and `features/*/` helpers: parsing, mapping, request building.
- **Test components** that hold logic (tables, forms, conditional states) with Testing Library queries by role and accessible name, the way a user finds them. Skip snapshot tests.
- **Components with `<Link>`** render through `renderWithRouter` (`src/test/render-with-router.tsx`); query with `findBy*` because the router renders asynchronously.
- **Components that call `useQuery`/`useMutation` themselves** (not just receiving data as props) render through `renderWithQueryAndRouter` (`src/test/render-with-router.tsx`), which adds a throwaway `QueryClient`.
- **Mock the network at `fetch`** (`vi.stubGlobal('fetch', …)`) rather than mocking `apiRequest`, so schemas and headers are exercised. `src/test/mock-fetch.ts` has `requestUrl` (reads the URL out of fetch's `RequestInfo | URL` first argument without a bare `.toString()`) and `sessionResponse` (a signed-in `get-session` response) for building a `mockImplementation` that dispatches on path; every `apiRequest` call hits `get-session` first until a token is cached.
- **No real data:** fixtures use invented songs and accounts.
- **Keep it fast:** no timers or sleeps; use `findBy*` for async UI.
