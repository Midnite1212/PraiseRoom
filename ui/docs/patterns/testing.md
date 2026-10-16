# Testing

Reference: `src/lib/api-client.test.ts`, `src/features/songs/songs-table.test.tsx`, `src/i18n/locales.test.ts`.

- **Vitest + Testing Library on jsdom.** `src/test/setup.ts` loads jest-dom matchers and i18n (English), and cleans up after each test.
- **Test pure logic** in `lib/` and `features/*/` helpers: parsing, mapping, request building.
- **Test components** that hold logic (tables, forms, conditional states) with Testing Library queries by role and accessible name, the way a user finds them. Skip snapshot tests.
- **Mock the network at `fetch`** (`vi.stubGlobal('fetch', …)`) rather than mocking `apiRequest`, so schemas and headers are exercised.
- **No real data:** fixtures use invented songs and accounts.
- **Keep it fast:** no timers or sleeps; use `findBy*` for async UI.
