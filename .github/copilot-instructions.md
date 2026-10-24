# Praise Room

A worship app built as a passion project by churchgoers in Hong Kong: a song library with chord charts, key transposition, and setlists shared through folders and public links, used on phones during worship. The full rules are in `AGENTS.md` (shared) and `ui/AGENTS.md` (UI); they win when this summary differs.

- `ui/`: the UI (React 19 with the React Compiler, TypeScript 7, Vite 8, Tailwind + shadcn/ui, TanStack Router, Query, Form, and Table, i18n in English and 繁體中文, pnpm), served in production.
- `server/`: TypeScript 7 (run with tsx), Express 4 + Drizzle ORM on Neon Postgres, auth through Neon Auth (Better Auth) proxied at `/api/auth/*`, pnpm.
- Commits and PR titles are `GH-<issue#>: …`; branches are `<issue#>-<type>-<description>`; PRs target `main`.
- Never put member names, emails, or other personal data in code, tests, logs, or PRs.
- Use GitNexus (call graph and impact analysis) before editing a symbol when it is installed; setup is in `AGENTS.md` under GitNexus Setup.
