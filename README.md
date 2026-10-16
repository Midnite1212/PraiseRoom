# Ripple Out Worship

_A song library, chord charts, and setlists for worship teams._

Ripple Out Worship (formerly "Psalted 2") is the HMCC Hong Kong worship team's app. Musicians open a setlist on their phone during worship and read lyrics with chords in any key; worship leaders build those setlists and share them with their team.

## What it does

| Area          | Features                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Songs         | Search by title, artist, or lyrics; filter by tempo and theme; open any song to read it                                                                                                    |
| Reading       | Chords above the lyrics, transposed to any key (major or minor), as letters or Nashville numbers (`1 4 5`, `6m`); lyrics-only mode; five lyrics sizes; a sticky title row while you scroll |
| Setlists      | Create, edit, and delete setlists with a date, ordered songs, and a key per song; grouped into upcoming, undated, and past; search and Mine / Shared filters                               |
| Musician view | One setlist on screen: song rail, progress strip, per-song keys, and ← / → to change songs                                                                                                 |
| Sharing       | Folders share setlists with their members; every setlist has a public link that opens a signed-out reading view                                                                            |
| Everyone      | Light and dark themes, English and 繁體中文, built for phones first                                                                                                                        |

## This fork

This repository is a self-hosted fork of [`Harvest-Mission-Global/ripple-out-worship`](https://github.com/Harvest-Mission-Global/ripple-out-worship). It runs on its own and no longer depends on the HMCC HK main site:

| Concern              | Before                                             | Now                                                                                                                                                                                             |
| -------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts and sign-in | The HMCC HK main site's login and a shared JWT key | [Neon Auth](https://neon.com/docs/auth/overview) (managed Better Auth) in this app's own Neon project, with email and password or Google sign-in                                                |
| Database             | MongoDB with Mongoose                              | [Neon](https://neon.com) Postgres with Drizzle ORM and versioned SQL migrations; songs were imported once from the MongoDB export, while setlists, folders, and ownership records started fresh |
| Hosting              | DreamHost, deployed by GitHub Actions              | [Vercel](https://vercel.com) services: the Express API as one function and the UI as a static site behind one domain, deploying only from `main`                                                |
| UI                   | Create React App, MUI, Redux                       | Rebuilt from scratch (see below); the previous UI is kept in `old-ui/` as a frozen reference                                                                                                    |

The server proxies `/api/auth/*` to Neon Auth on the app's own domain, so session cookies are first-party (which keeps Safari working) and the browser never talks to Neon directly. API requests carry a short-lived JWT that the server verifies against Neon Auth's public keys.

## Repository layout

Independent packages in one repo, each with its own lockfile (no workspaces):

| Folder    | What it is                                                                          | Package manager |
| --------- | ----------------------------------------------------------------------------------- | --------------- |
| `ui/`     | The production UI                                                                   | pnpm            |
| `server/` | Express API, database access, and the auth proxy                                    | pnpm            |
| `old-ui/` | The previous UI: not deployed, kept as the reference for screens not yet rebuilt    | pnpm            |
| root      | ESLint and Prettier for `old-ui/` and `server/`, Husky, lint-staged, and commitlint | pnpm            |

## Tech stack

| Layer    | `ui/`                                                                              | `server/`                                                           |
| -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Runtime  | React 19 with the React Compiler                                                   | Node 24, Express 4                                                  |
| Language | TypeScript 7                                                                       | TypeScript 5 (ts-node)                                              |
| Build    | Vite 8                                                                             | Compiled by Vercel's Express preset                                 |
| Data     | TanStack Query, TanStack Router (file-based), TanStack Form, TanStack Table, Zod 4 | Drizzle ORM over `pg` on Neon Postgres                              |
| UI       | Tailwind CSS v4, shadcn/ui on Radix, lucide icons, next-themes                     | —                                                                   |
| Auth     | Thin `fetch` client for the server's `/api/auth/*` proxy                           | Neon Auth proxy; JWT verification with `jose`                       |
| i18n     | i18next + react-i18next (English, 繁體中文)                                        | —                                                                   |
| Quality  | Oxlint (type-aware) and oxfmt; Vitest + Testing Library                            | ESLint and Prettier; `node:test`, plus a Postgres integration suite |

## Getting started

**Prerequisites:** Node 24 (`.nvmrc`) and pnpm 10 (`corepack enable` gives you the pinned version).

```bash
# Install: the root install also enables the git hooks
pnpm install
(cd server && pnpm install)
(cd ui && pnpm install)

# Configure the server: create server/.env with the variables below (never commit it)

# Run (two terminals)
cd server && pnpm dev                 # API on http://localhost:1338
cd ui && pnpm dev                     # UI on http://localhost:3000, proxying /api to the server
```

`server/.env`:

| Variable             | Purpose                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Neon Postgres connection string (the pooled `-pooler` URL with `sslmode=require` works) |
| `NEON_AUTH_BASE_URL` | Neon Auth base URL from the Neon console (Auth → Configuration)                         |
| `BASE_URL`           | Public origin used to build setlists' public links                                      |
| `PORT`               | Local port, default `1338`                                                              |
| `DATABASE_POOL_MAX`  | Optional; connections per instance, default `3`                                         |

Use `http://localhost:3000`, not `127.0.0.1`: Neon Auth's "Allow localhost" setting only trusts `localhost`.

### Useful scripts

| Where     | Command                                                                           | Does                                                                                                    |
| --------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `ui/`     | `pnpm typecheck` / `pnpm lint` / `pnpm format:check` / `pnpm test` / `pnpm build` | The checks CI runs                                                                                      |
| `server/` | `pnpm typecheck` / `pnpm test`                                                    | Type-check and unit tests; set `DATABASE_URL_TEST` to a throwaway database to add the integration suite |
| `server/` | `pnpm db:generate` / `pnpm db:migrate`                                            | Create a migration from `src/db/schema.ts` / apply pending migrations to `DATABASE_URL`                 |
| root      | `pnpm lint`                                                                       | ESLint over `old-ui/` and `server/`                                                                     |

## Deployment

- One Vercel project in services mode, configured by `vercel.json`: `/api/*` goes to the `server` service, everything else to the `ui` service (`ui/`, with a fallback to `index.html` for client routes).
- Only `main` deploys automatically; pull requests get no preview.
- Vercel never runs migrations. Apply them with `DATABASE_URL='<neon direct url>' pnpm db:migrate` from `server/` before merging code that needs them.
- Vercel environment variables: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `BASE_URL`. The UI needs none.
- Add the production domain to Neon Auth's trusted domains, or sign-in fails with `INVALID_ORIGIN`.

## Access

Everyone who signs in gets an ownership record with an access type:

| Access type        | Can                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `member` (default) | Read songs; create setlists and folders; edit setlists they created or that are shared with their folders |
| `editor`           | Everything a member can, plus add, edit, and delete songs                                                 |
| `admin`            | Everything, on every setlist and folder                                                                   |

Promote someone in the database (their user id is in Neon Auth's user table):

```sql
update ownerships set access_type = 'admin' where user_id = '<neon auth user id>';
```

The UI hides what you can't do, but the server enforces every rule.

## Still to rebuild

The new UI doesn't have these old-UI screens yet; their URLs show "not found" until they're rebuilt (`old-ui/` shows how they worked): sign-up, password reset, adding and editing songs, and the profile page.

## Contributing

Issues live on this fork: [`Midnite1212/ripple-out-worship`](https://github.com/Midnite1212/ripple-out-worship/issues).

1. **Branch** from `main` as `<issue#>-<type>-<description>`, for example `80-feature-setlist-editor`. Types: `feature`, `hotfix`, `docs`, `chore`.
2. **Commit** from the command line so the hooks run (formatting, linting, and the message check). Every message starts with the branch's issue number: `GH-80: add the song search panel`.
3. **Open a pull request** into `main` titled `GH-<issue#>: …`, with `Closes #<issue#>` on the first line of the description; see `.claude/docs/pr-description.md` for the format. The PR checks run lint, both UIs' checks, and the server's.
4. **Stacked pull requests:** retarget each one to `main` before merging, so its issue closes automatically.

Rebase onto `main` (`git pull --rebase`) instead of merging it into your branch.

### Working with AI coding agents

The repo carries instructions for Claude Code, Codex, Cursor, OpenCode, and Copilot:

- `AGENTS.md` (shared rules), `ui/AGENTS.md` (new UI), and `old-ui/AGENTS.md` (old UI), each with a `CLAUDE.md` symlink.
- `ui/docs/patterns/`: living component, data, routing, form, table, i18n, and testing patterns that agents and teammates update alongside the code.
- Agent personas and skills in `.claude/agents/` and `.claude/skills/` (also at `.agents/skills/`), plus OpenCode and Cursor pointers.
- MCP servers for the shadcn registry and Context7 docs in `.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, and `opencode.json`.
- [GitNexus](https://github.com/abhigyanpatwari/GitNexus) for the call graph agents use before editing (impact analysis, execution flows, UI-to-API route links). It is installed per machine; see GitNexus Setup in `AGENTS.md`.

## Contributors

Jesus' disciples
