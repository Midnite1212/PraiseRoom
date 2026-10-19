# Praise Room

The HMCC Hong Kong worship-team app: a song library with chord charts, key transposition, and setlists shared through folders and public links, used on phones during worship. The full rules are in `AGENTS.md` (shared), `ui/AGENTS.md` (new UI), and `old-ui/AGENTS.md` (old UI); they win when this summary differs.

- `ui/`: the new UI being built (React 19 with the React Compiler, TypeScript 7, Vite 8, Tailwind + shadcn/ui, TanStack Router, Query, Form, and Table, i18n in English and 繁體中文, pnpm). Served in production; old pages not rebuilt yet show not-found.
- `old-ui/`: the previous UI (React 18, MUI v5, Redux Toolkit, react-router v6, pnpm), no longer deployed; a frozen reference.
- `server/`: TypeScript 7 (run with tsx), Express 4 + Drizzle ORM on Neon Postgres, auth through Neon Auth (Better Auth) proxied at `/api/auth/*`, pnpm.
- Commits and PR titles are `GH-<issue#>: …`; branches are `<issue#>-<type>-<description>`; PRs target `main`.
- Never put member names, emails, or other personal data in code, tests, logs, or PRs.
- Use GitNexus (call graph and impact analysis) before editing a symbol when it is installed; setup is in `AGENTS.md` under GitNexus Setup.
