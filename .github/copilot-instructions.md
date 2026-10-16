# Ripple Out Worship

The HMCC Hong Kong worship-team app: a song library with chord charts, key transposition, and setlists shared through folders and public links, used on phones during worship. The full rules are in `AGENTS.md` (shared), `ui/AGENTS.md` (new UI), and `old-ui/AGENTS.md` (old UI); they win when this summary differs.

- `ui/`: the new UI being built (React 19 with the React Compiler, TypeScript 7, Vite 8, Tailwind + shadcn/ui, TanStack Router, Query, Form, and Table, i18n in English and 繁體中文, pnpm). Not deployed until cutover.
- `old-ui/`: the production UI (React 18, MUI v5, Redux Toolkit, react-router v6, yarn). Frozen except for fixes.
- `server/`: Express 4 + Drizzle ORM on Neon Postgres, auth through Neon Auth (Better Auth) proxied at `/api/auth/*`, yarn.
- Commits and PR titles are `GH-<issue#>: …`; branches are `<issue#>-<type>-<description>`; PRs target `main`.
- Never put member names, emails, or other personal data in code, tests, logs, or PRs.
