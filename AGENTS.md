# Instructions for the Ripple Out Worship agentic coding assistant

## Do this BEFORE you plan, propose, or act

### Mandatory Procedure

1. Match all tasks you're about to do against the _trigger table_. There can be multiple rules/files matched.
2. List ALL rule files you match, in bullet points.
3. Always open/read ALL matching docs.
4. Output a **Compliance** line quoting the exact rule, verbatim, from each doc.
5. Only then continue with your task.

### Trigger Table

If your work involves the task below, read the corresponding document/section first:

- write a commit message, branch name, or PR title/description → `.claude/docs/commit-convention.md` and `.claude/docs/pr-description.md`
- write or change code in the new UI (`ui/`) → `ui/AGENTS.md` and the `ui-frontend` skill (or subagent)
- add or change a component pattern, folder layout, or data pattern in `ui/` → `ui/docs/patterns/` and the `ui-patterns` skill
- fix something in the old UI (`old-ui/`) → `old-ui/AGENTS.md` and the `old-ui-frontend` skill (or subagent)
- write or change any backend code → `#backend-express`
- add or change an API endpoint → `#backend-express` (routes, `ROUTE_PERMISSIONS`, and the controller shape)
- touch login, JWT, the bearer header, or Neon Auth → `#auth-flow`
- handle user, ownership, group, or profile data → `#data-handling`
- review a branch or PR → the `/code-review` or `/deep-review` skill
- execute a plan or issue checklist → the `/gh-execute` skill

### Required Compliance-line format (the rule text comes from the doc, not from here)

> **Compliance (<doc-path-or-section>):** "<verbatim sentence copied from that doc>" → <what you will do>

---

> This file is the single source of shared instructions for **all** agentic coding assistants (Claude Code, Codex, OpenCode, Cursor, Copilot, and others). `CLAUDE.md` is a symlink to `AGENTS.md`; edit `AGENTS.md` only. Each UI has its own nested `AGENTS.md` (with a `CLAUDE.md` symlink) that tools load for files under that folder: `ui/AGENTS.md` and `old-ui/AGENTS.md`. Skills, docs, and agent personas live under `.claude/` and are exposed to every tool: `.agents/skills` is a symlink to `.claude/skills` (Codex, Cursor, OpenCode read it), and `.opencode/agent/` and `.cursor/agents/` hold OpenCode's and Cursor's pointers to the subagents. Copilot reads `.github/copilot-instructions.md` plus the path-specific files in `.github/instructions/`. Keep `.claude/settings.local.json` out of git.

# ripple-out-worship

## Project Overview

The HMCC Hong Kong worship-team app: a song library with chord charts, key transposition, and setlists that can be grouped into folders, shared with teammates, and published as a public link. The README still calls it "Psalted 2", its earlier name.

Independent packages in one repo, no workspaces wiring:

- `ui/` — **the production UI, still being rebuilt**: React 19 with the React Compiler, TypeScript 7, Vite 8, Tailwind v4 + shadcn/ui, TanStack Router/Query/Form/Table, pnpm. Old routes it doesn't have yet (public setlist links, password reset, sign-up, song and setlist editing, profile) show not-found until rebuilt. Rules in `ui/AGENTS.md`.
- `old-ui/` — the previous UI, no longer deployed: React 18 TypeScript SPA on Vite 8, MUI v5, Redux Toolkit, react-router-dom v6, pnpm. Kept as the reference for screens not yet rebuilt; frozen. Rules in `old-ui/AGENTS.md`.
- `server/` — Express 4 + Drizzle ORM on Postgres (Neon) in **TypeScript**, run with `ts-node` through nodemon, pnpm
- Root `package.json` — Husky, lint-staged, commitlint, and oxlint and oxfmt for the root files, pnpm

Login, sign-up, and password reset run on Neon Auth (Managed Better Auth) in this app's own Neon project; the app no longer depends on the HMCC HK main site. See `#auth-flow`.

Tracking is GitHub Issues on `Midnite1212/ripple-out-worship`, a self-hosted fork of `Harvest-Mission-Global/ripple-out-worship`; issue numbers below #2 in history refer to the upstream repo. Commits are `GH-<issue#>: …`, branches `<issue#>-<type>-<description>`, and PRs target `main`. See `.claude/docs/commit-convention.md`.

## Important Instruction Reminder

- Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal. Prefer editing an existing file.
- NEVER proactively create documentation files or READMEs unless asked. The exception is `ui/docs/patterns/`, which you update in the same PR as a pattern change (see the `ui-patterns` skill).
- Server unit tests cover utils, middleware, and controller input handling (`server/src/**/*.test.ts`, `node:test`); each UI's test scope is in its own `AGENTS.md`. When you change covered logic, keep the tests green and add a case; do not rewrite an expected value to make a test pass unless the behaviour change is intended and stated.
- Reuse existing components and helpers before inventing new ones.
- Every folder uses **pnpm** 10 with its own lockfile and no workspace (`pnpm install` to install, `pnpm <script>` to run, `pnpm exec <binary>` for binaries). Never yarn, npm, or npx for project work; the only npm use in these docs is the global GitNexus install (`#gitnexus-setup`), a per-machine tool that never touches a lockfile.

## Development Commands

```bash
# Install (separate installs, no workspaces); the root install also enables the husky hooks
pnpm install && (cd server && pnpm install) && (cd ui && pnpm install) && (cd old-ui && pnpm install)

# Run locally (two terminals): the server, plus whichever UI you are working on (both use :3000)
cd server && pnpm dev           # Express on :1338 via nodemon + ts-node
cd ui && pnpm dev               # new UI; see ui/AGENTS.md for its other scripts
cd old-ui && pnpm dev           # old UI; see old-ui/AGENTS.md

# Server (in server/)
pnpm typecheck                  # tsc --noEmit; 0 errors required (noUnusedLocals and noUnusedParameters are on)
pnpm test                       # node:test unit tests, no database needed
DATABASE_URL_TEST=<url> pnpm test  # also runs src/db/integration.test.ts against a disposable Postgres database
pnpm db:generate                # drizzle-kit generate: new SQL migration in server/drizzle/ from src/db/schema.ts
pnpm db:migrate                 # drizzle-kit migrate: apply pending migrations to DATABASE_URL
pnpm import:songs --file <songs.json> [--apply]  # one-off MongoDB songs import; see #cutover-from-mongodb-songs-only

# Lint and format: each package (root, server/, old-ui/, ui/) runs its own oxlint and oxfmt with its own config
pnpm lint                       # oxlint --deny-warnings (ui/ adds --type-aware); 0 problems required
pnpm format                     # oxfmt in place; `pnpm format:check` is what CI runs. From the root it formats every package with its own config

# Both Vercel services together, no Vercel login (optional; needs the Vercel CLI)
vercel dev -L
```

Every package has an `.oxfmtrc.json` (2-space, single quotes, semicolons, `printWidth: 100`, `trailingComma: 'es5'`, sorted imports; `ui/` also sorts Tailwind classes) and an `.oxlintrc.json`. Husky runs lint-staged on commit (`lint-staged.config.mjs`: oxfmt and oxlint for each staged file, run inside its package with that package's binaries and config) and commitlint on the message.

## Technology Stack

- **New UI** (`ui/`): see `ui/AGENTS.md`.
- **Old UI** (`old-ui/`): see `old-ui/AGENTS.md`.
- **Server**: Express 4, Drizzle ORM (`drizzle-orm`, `drizzle-kit`) over node-postgres (`pg`) on Neon Postgres, `jose` (JWKS verification)

Majors only. Each folder's `package.json` is the source of truth for exact versions; check it before relying on an API.

## Architecture

### Backend (`server/`)

| Path                                           | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.ts`                                       | Vercel `server` service entry: default-exports the app; run directly (`pnpm dev`, `pnpm start`) it connects, then listens on `PORT`                                                                                                                                                                                                                                                                                                                                         |
| `src/createApp.ts`                             | `createApp()`: `/api/auth/*` + `/api/auth-callback` router (before the JSON parser, since it forwards raw bodies to Neon Auth), `ensureDatabase` for `/api`, JSON body, routes, a JSON 404 for unknown `/api`                                                                                                                                                                                                                                                               |
| `src/db/connect.ts`                            | `getDb()` (lazy `pg` pool + Drizzle from `DATABASE_URL`), `ensureDatabase()` (one memoized `select 1` per instance, shared by concurrent requests, retried after a failure), `closeDatabase()`                                                                                                                                                                                                                                                                              |
| `src/db/schema.ts`                             | Drizzle tables; `drizzle/` holds the generated SQL migrations and `drizzle.config.ts` points drizzle-kit at both                                                                                                                                                                                                                                                                                                                                                            |
| `src/db/repositories/<resource>.repository.ts` | The only code that queries the database: casts input like Mongoose did (`InvalidInputError` → 400), runs multi-table writes in a transaction, and returns the API JSON shape                                                                                                                                                                                                                                                                                                |
| `src/auth/neonAuth.routes.ts`                  | Proxies `/api/auth/*` to `NEON_AUTH_BASE_URL` (Neon cookies only, `set-auth-jwt` passed through, cookies rewritten to first-party `HttpOnly; Secure; SameSite=Lax`) and finishes Google OAuth at `GET /api/auth-callback?next=<path>` by swapping the `neon_auth_session_verifier` for session cookies; 503 when `NEON_AUTH_BASE_URL` is unset. Plain `fetch`, no Neon SDK: Vercel's CommonJS shim for the ESM-only `@neondatabase/auth/server` lost its exports at runtime |
| `src/routes/index.ts`                          | `getRoutes()`: one router combining the ownership, group, setlist, and song routers                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/routes/<resource>.routes.ts`              | `createPermissionRouter()` + one line per action, registered with the full path (`'/api/songs/create'`)                                                                                                                                                                                                                                                                                                                                                                     |
| `src/policies/`                                | `PermissionRouter`, `permissionMiddleware` (`requireAuth`, `requireAccessType`), and `permissions.config.ts` (`ROUTE_PERMISSIONS`)                                                                                                                                                                                                                                                                                                                                          |
| `src/controllers/<resource>.controllers.ts`    | One exported `RequestHandler` per action                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `src/types/`                                   | `<Resource>Record` (API JSON shape) and `<Resource>Access` (authorization fields) per resource                                                                                                                                                                                                                                                                                                                                                                              |
| `src/utils/`                                   | `verify-jwt.ts` (Neon Auth JWKS verification), `response.ts`, `pick.ts`, `validation.ts`; password-reset email is sent by Neon Auth, not this repo                                                                                                                                                                                                                                                                                                                          |

## Backend (Express)

### Adding an endpoint

1. Add the handler to `src/controllers/<resource>.controllers.ts` and export it.
2. Add one line to `src/routes/<resource>.routes.ts` with the full URL: `router.get('/api/<resource>/action', handler)`. `createApp()` mounts the routers at the root, so the registered path is the exact URL the UI calls and the `ROUTE_PERMISSIONS` key, which lets GitNexus `route_map` link UI callers to the route.
3. Add `'GET /api/<resource>/action'` to `ROUTE_PERMISSIONS` in `src/policies/permissions.config.ts`. A route with no entry logs a warning and falls back to `requireAuth`; never rely on that.

### Permissions

- `requiresAuth: true` adds `requireAuth` (valid JWT). `allowedAccessTypes` then adds `requireAccessType`. `PermissionConfig` is a union, so `allowedAccessTypes` cannot be set on a public route.
- `requiresAuth: false, optionalAuth: true` fills `req.user` when a valid token is sent and never rejects. Use it for endpoints that serve both the public setlist view and logged-in pages (`GET /api/setlists/get`), and branch on `req.user` in the controller.
- Access types on the server: `member`, `editor`, `admin` (`ACCESS_TYPES` in `permissions.config.ts`; `DEFAULT_ACCESS_TYPE` is `member`). The list is not hierarchical here: only the types listed are allowed. `requireAccessType` loads the caller's `accessType` from `ownerships.access_type` by the token's `sub`, since Neon Auth tokens carry no custom claims. Song writes (`create`/`update`/`delete`) are gated to `SONG_WRITERS = ['editor', 'admin']`.
- `requireAuth` only proves the caller is logged in. Setlist, folder, and ownership writes check ownership through `src/utils/authorization.ts` (`canEditSetlist`, `canDeleteSetlist`, `canEditGroup`, `canDeleteGroup`, `findCallerOwnership`, `sendForbidden`): load the target, then the caller's ownership, then 403 with `sendForbidden` before writing. New write endpoints must do the same.
- Rules: a setlist's creator, an admin, or a member of a folder listed in `setlist.groupIds` can edit it; only its creator or an admin can delete it. Folder members can edit a folder; only its creator or an admin can delete it (legacy folders without `createdBy`: any member). Folder membership changes go through `PUT /api/groups/members`; `PUT /api/ownerships/update` is self-only and accepts `setlistIds` only.
- `folder.setlistIds` and `setlist.groupIds` are two views of one `group_setlists` table, so linking either way grants the folder's members edit rights on the setlist. A folder write may newly add only setlists the caller can edit (`canEditSetlists`); a setlist write may newly link only folders the caller can edit, and keeps links to live folders the caller cannot edit (`resolveGroupLinks`).

### Controller shape

```ts
const getSong: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.query;
  if (!isObjectIdString(id)) {
    sendResponse(res, 400, 'Invalid song id');
    return;
  }
  try {
    const song = await songRepository.findLiveById(id);
    if (!song) {
      sendResponse(res, 404, 'Song not found');
      return;
    }
    sendResponse(res, 200, song);
  } catch (error: unknown) {
    sendError(res, error);
  }
};
```

Shared helpers in `src/utils/`: `sendResponse` / `sendError` (`response.ts`; `sendError` maps `InvalidInputError` and Postgres data or constraint errors (`INVALID_INPUT_SQLSTATES`: `22001`, `22003`, `22007`, `22008`, `22009`, `22021`, `22P02`, `23502`, `23503`, `23514`) to 400 and everything else to a logged, generic 500, unwrapping `DrizzleQueryError` so query parameters are never logged), `pick` (`pick.ts`), and `isObjectIdString` / `toObjectIdList` (`validation.ts`). Use them; do not add another per-controller `sendResponse`.

- Validate and narrow `req.query` / `req.body` values before using them in a query. Query values may be strings, arrays, or objects; ids must pass `isObjectIdString`.
- Controllers never import `drizzle-orm` or query the database; they call a repository. Importing constants from the schema (`MUSIC_KEYS`) is fine. Unit tests mock repository methods with `mock.method(songRepository, 'findLiveById', …)`.
- Never pass `req.body` straight into a repository. `pick` the allowed fields. Set `createdBy`, `userId`, and `accessType` from `req.user`, never from the body.
- An update for a missing id must 404, not create a row. The only insert-or-return is `ownershipRepository.createIfMissing`.
- Never send `error.message` to the client. Use `sendError`.
- Pass user text to `ilike` through `containsPattern`, which escapes `%`, `_`, and `\`. Never build SQL with string concatenation; use the query builder or `sql` template parameters.
- Ids are 24-hex Mongo-style strings, stored lowercase (`generateObjectId`, `toObjectId`), so public setlist links and `isObjectIdString` keep working.
- Soft delete is the convention: every top-level table has `is_deleted`. Filter it in every read and update. Delete endpoints are `PUT /api/<resource>/delete` and set it to true.
- Requests that write more than one table run inside `getDb().transaction(…)` in the repository.
- Text values go through the `cast.ts` helpers, which reject NUL characters (Postgres text cannot store them) with a 400; setlist dates must fall in the years 1000–9999.
- Schema changes: edit `src/db/schema.ts`, run `pnpm db:generate`, commit the new `drizzle/` files, and never edit an applied migration. Vercel never runs migrations: apply them with `DATABASE_URL='<neon direct url>' pnpm db:migrate` before merging code that needs the new schema.

### Server type-check

`server/tsconfig.json` has `noUnusedLocals` and `noUnusedParameters`. Prefix intentionally unused parameters with `_`. `pnpm exec tsc --noEmit` in `server/` must show 0 errors.

### Cutover from MongoDB (songs only)

Only songs move to Postgres. Setlists, folders, and ownerships are not imported; each user's ownership record is recreated on first login. `scripts/import-songs.ts` (outside the build) maps each exported document with `src/db/importSongs.ts`, keeping the Mongo `_id` as the row id and casting fields with the same rules as the song API (`toSongValues`), skips documents with a bad id, a missing or uncastable field, a NUL character, or a duplicate id (reported by index, id, and reason only), and inserts in one transaction with `on conflict (id) do nothing`, so a re-run is a no-op. Use Neon's direct (non-pooled) URL for the migration and the import, and keep the export outside the repo:

```bash
mongoexport --uri '<mongo uri>' --collection=songs --jsonArray --out=<outside the repo>/songs.json
cd server
read -rs DATABASE_URL && export DATABASE_URL   # paste the Neon direct url; keeps it out of shell history
pnpm db:migrate
pnpm import:songs --file <outside the repo>/songs.json          # dry run: read, valid, skipped ids with reasons, would insert
pnpm import:songs --file <outside the repo>/songs.json --apply  # inserted vs already present
```

Then set the Vercel `DATABASE_URL` to Neon's pooled `-pooler` URL and redeploy.

## Auth Flow

- Users, sessions, and sign-in live in Neon Auth (Managed Better Auth) in this app's own Neon project. This repo has no dependency on the HMCC HK main site for auth; there is no `/external-api` proxy and no `MAIN_URL`.
- This server verifies Neon Auth's EdDSA JWTs against its JWKS (`jose`, `src/utils/verify-jwt.ts`) instead of a shared `JWT_KEY`, and reads **`Authorization: Bearer <token>`**. `req.user` (`AuthenticatedRequest`) holds the decoded `{ id, emailAddress, name }` plus `accessType` loaded from `ownerships.access_type` by the token's `sub` (Neon Auth tokens carry no custom claims). Trust `req.user` for identity; never trust a `userId` or `accessType` sent in the request body.
- The server proxies every `/api/auth/*` request to `NEON_AUTH_BASE_URL` (`server/src/auth/neonAuth.routes.ts`: Neon cookies only, `set-auth-jwt` passed through, cookies rewritten to first-party) and finishes Google OAuth at `GET /api/auth-callback?next=<path>`. Both UIs talk to this proxy on their own origin and read the API JWT from the `set-auth-jwt` header of `get-session`; neither uses the Neon Auth SDK. Each UI's client is described in its `AGENTS.md`.

## Data Handling

Neon Auth owns user accounts (name, email, password); this repo's own data carries only an id, name, and access type per user. `Ownership` stores names and access types; groups store who is on which team.

- Never paste personal data into commits, PR bodies, issue comments, screenshots, fixtures, or logs. Use dummy accounts for screenshots and blur anything real.
- Server log lines carry IDs, not names or emails.
- Endpoints return only the fields the UI needs. Do not add endpoints that list every ownership or user to unauthenticated callers.
- `VITE_*` values are inlined into the public bundle; never put a secret there. There are no custom `VITE_*` vars today; the auth client talks to this app's own origin, not a Neon Auth URL directly.
- No credentials in code. Deployed values live in the Vercel project's environment variables; local `.env` files are never committed.
- Public setlist links (`/setlist/view/:id`) are visible to anyone; they must show song content only, not member data.

## Environment Variables

- `server/.env` (loaded by `dotenv` in `app.ts`): `PORT`, `BASE_URL`, `NEON_AUTH_BASE_URL` (the Neon Auth base URL), `DATABASE_URL` (Postgres connection string; Neon's pooled `-pooler` URL with `sslmode=require` works), optional `DATABASE_POOL_MAX` (connections per function instance, default 3). Without `NEON_AUTH_BASE_URL`, `/api/auth/*` returns 503 `'Sign-in is not configured'` and the server can't verify bearer tokens.
- `DATABASE_URL_TEST` (shell only, never in `.env`): a disposable Postgres database for `pnpm test`; the integration suite migrates it and truncates every table, so it refuses to run unless the database name contains `test` and differs from `DATABASE_URL`, and is skipped when unset (CI runs without it).
- `ui/.env` and `old-ui/.env`: none required today. Both auth clients talk to `${window.location.origin}/api/auth`, so there is no `VITE_*` var to configure.
- `NODE_ENV=test` means "local development" in this repo: it disables static serving of `server/client/` when `app.ts` runs directly. The `dev` script sets it through `cross-env`.
- Vercel project (all environments): `NEON_AUTH_BASE_URL`, `BASE_URL` (the public origin `publicLink` is built from), `DATABASE_URL` (the Neon pooled `-pooler` connection string with `sslmode=require`) for the `server` service at runtime. The `ui` service needs no build-time env vars. The Neon integration may also add `VITE_NEON_AUTH_URL`; nothing reads it, because the UI reaches Neon Auth through `/api/auth`. `PORT` is not used on Vercel.

## CI / Deploy (`.github/workflows/`)

- Hosting is one Vercel project in [services](https://vercel.com/docs/services) mode, configured by the root `vercel.json`: `server` (`server/`, Express preset, one Vercel Function from `app.ts`) and `ui` (`ui/`, Vite preset, installed with pnpm from `ui/pnpm-lock.yaml`, static `dist/`, with a service-level rewrite to `/index.html` for client routes, since the Vite preset has no SPA fallback). `old-ui/` is not deployed. Top-level rewrites send `/api/*` to `server` and everything else to `ui`; each service receives the original path, and routing into a service is final. Each service installs with its own lockfile. Vercel deploys from the connected Git repo, and `git.deploymentEnabled` limits automatic deployments to `main`, so PRs get no preview; there is no deploy workflow.
- Node 24 everywhere: `engines.node` (`24.x`) in each `package.json` sets the Vercel build and function runtime, and `.nvmrc` and CI match it.
- `pr-check.yml` runs on PRs to `main`: root lint, old UI typecheck and tests, new UI checks (pnpm install, typecheck, oxlint, oxfmt check, tests, build), and server typecheck and tests (Node 24). Keep them green.
- `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` are Copilot's short summaries; the `AGENTS.md` files are the source of truth when they differ.

## PR and Commit References

Read `.claude/docs/commit-convention.md` and `.claude/docs/pr-description.md` before writing any of these. Short version: `GH-<issue#>:` on every commit and PR title (commitlint enforces it against the branch's issue number), `Closes #<issue#>` as the first PR line, base PRs on `main`, stack dependent PRs.

## Common Gotchas

1. A route missing from `ROUTE_PERMISSIONS` silently falls back to `requireAuth`.
2. Public routes cannot take `allowedAccessTypes`; use `optionalAuth` when a public endpoint must know who is calling.
3. `requireAuth` is authentication, not authorisation. Check ownership on writes with the helpers in `utils/authorization.ts`.
4. Access types are `member`, `editor`, `admin` (no hierarchy); only `editor` and `admin` can write songs (`SONG_WRITERS` server-side, the `'editor'` route permission client-side). `member` is the default for a new ownership record.
5. Every top-level table has `is_deleted`; filter it on every read and update. Soft-deleted songs still appear inside a setlist's populated `songs`, as they did under Mongoose `populate`.
6. Server tests rely on `node --test` expanding `'src/**/*.test.ts'` itself, so quote the glob in the script.
7. On Vercel the SPA is the `ui` service, never the Express app, and `express.static` is ignored there. Locally use the Vite dev server on :3000. `server/` must not have a `build` script: Vercel's Express preset would run it, take `dist/app.js` as the handler at the function root, and lose `server/node_modules`, so every request fails with `Cannot find module`. Vercel compiles `app.ts` itself and type-checks it.
8. `isObjectIdString` requires a 24-character hex string in either case; repositories lowercase ids before querying, so compare stored ids against `toObjectId(id)`, not the raw request value. User ids are a separate shape: `isUserIdString` validates a Neon Auth user id, which is stored and compared as given, never lowercased.

## Tooling

- `gh` CLI for issues and PRs: `gh issue view <n> -R Midnite1212/ripple-out-worship --comments`, `gh pr view --json baseRefName`, `gh pr create -R Midnite1212/ripple-out-worship --base main` (without `-R`, `gh` targets the upstream parent).
- Skills in `.claude/skills/` (also reachable as `.agents/skills/`): `ui-frontend`, `ui-patterns`, `old-ui-frontend`, `code-review`, `deep-review`, `gh-execute`, plus the `gitnexus-*` set (regenerated by `gitnexus analyze`; do not hand-edit). Every tool that supports `SKILL.md` finds them there.
- GitNexus is expected in this repo (see `#gitnexus-setup` and the block at the end of this file). The committed parts are the skills and that block; the index itself is per-machine.
- Agent personas in `.claude/agents/`: `ui-frontend.md` (new UI) and `old-ui-frontend.md` (old UI). Claude Code dispatches them as subagents, OpenCode via `.opencode/agent/`, Cursor via `.cursor/agents/`, and every other tool through the skill of the same name, which points at the same file. Edit the `.claude/agents/` files only; the others are pointers.
- Docs in `.claude/docs/`: `commit-convention.md`, `pr-description.md`. New-UI patterns in `ui/docs/patterns/`.
- MCP servers for the new UI (shadcn registry, Context7 docs) are configured per tool: `.mcp.json` (Claude Code), `.cursor/mcp.json`, `.vscode/mcp.json` (Copilot in VS Code), `opencode.json`; Codex reads `~/.codex/config.toml`, so `ui/AGENTS.md` has the snippet. TanStack docs come from `@tanstack/cli` in `ui/` (`pnpm exec tanstack search-docs …`).

## GitNexus Setup

GitNexus gives the agent a call graph of this repo (impact analysis, execution flows, safe renames, taint analysis, and UI-to-API route links). The rules in the block below assume it is running. It needs GitNexus 1.6.13-rc.109 or later, which links typed wrapper calls such as `axios.get<T>('/api/…')` to their server routes, on Node `^22.18` or `>=24.11`. One-time steps per machine and clone:

```bash
npm i -g gitnexus@rc --allow-scripts=gitnexus,@ladybugdb/core  # per-machine CLI; newer npm skips install scripts unless allowed; use gitnexus@latest once 1.6.13 is stable
gitnexus analyze --pdg      # builds the local index into .gitnexus/ (gitignored) and writes .gitnexus/run.cjs; --pdg enables taint analysis
gitnexus setup              # registers the MCP server in your coding tool (Claude Code, Cursor, OpenCode, Codex, …); add -c <tool> to pick one
```

Re-run `analyze` after pulling large changes or when a tool reports the index is stale, and after upgrading GitNexus. `.gitnexusrc` lists the HTTP client wrappers whose calls link to server routes (`route_map`); add a new wrapper there. Never commit `.gitnexus/`; it contains absolute paths and a machine-local database.

If GitNexus is not installed yet, say so at the start of the task and fall back to grep and file reads; do not pretend to have run `impact`.

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ripple-out-worship** (13904 symbols, 27073 relationships, 369 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only`. No `.gitnexus/run.cjs`? Bootstrap with `npx`, `bunx`, or `pnpm dlx`; e.g. `bunx gitnexus@latest analyze` (#1939).
> On query/context/impact/cypher object results, read staleness.status and branch/lastCommit. Re-analyze only for behind or diverged — current is clone HEAD, not main.

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers/processes/risk. Never substitute grep for graph analysis. For unified PDG impact, add `mode: "pdg"` with optional `line: <N>` — it returns statement-level `affectedStatements` over CDG + REACHING_DEF and inter-procedural symbols in `interproceduralByDepth`/`byDepth`; no-layer/degraded PDG results are UNKNOWN-risk notes (`--pdg` layer). CLI equivalent: `node .gitnexus/run.cjs impact "symbolName" --direction upstream --mode pdg --line <N> --repo .`.
- **MUST analyze changes before commit.** Run `detect_changes({scope: "all"})` or `node .gitnexus/run.cjs detect-changes --scope all --repo .`. `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review, fetch target branch "main" from its remote; compute its merge base with the reviewed HEAD and pass that SHA to `detect_changes({scope: "compare", base_ref: "<merge-base SHA>"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "<merge-base SHA>" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).
- For control/data dependence, `pdg_query({mode: "controls", target: "fileOrSymbol"})` answers "under what condition does X run?" (CDG, incl. guard clauses) and `pdg_query({mode: "flows", target, variable})` traces "where does variable Y flow?" (REACHING_DEF). `--pdg` layer.

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` with `dry_run: true` first, review the graph-backed semantic spans and coverage, then apply with `dry_run: false`.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource                                            | Use for                                  |
| --------------------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/ripple-out-worship/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/ripple-out-worship/clusters`       | All functional areas                     |
| `gitnexus://repo/ripple-out-worship/processes`      | All execution flows                      |
| `gitnexus://repo/ripple-out-worship/process/{name}` | Step-by-step execution trace             |

## CLI

| Task                                         | Read this skill file                               |
| -------------------------------------------- | -------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.claude/skills/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.claude/skills/gitnexus-cli/SKILL.md`             |

<!-- gitnexus:end -->
