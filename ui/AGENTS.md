# New UI (`ui/`) — rules for agents

> Read the root `AGENTS.md` first; its Mandatory Procedure, commit rules, server and auth rules, and data handling apply here too. This file covers `ui/` only, and nested-`AGENTS.md`-aware tools load it for files under this folder. `ui/CLAUDE.md` is a symlink to this file.

`ui/` is the production UI (the Vercel `ui` service), rebuilt from scratch. Screens it doesn't have yet show not-found.

## Fixed rules and editable patterns

- **This file holds the fixed rules** for `ui/`: stack, commands, safety, data handling, and verification. Change it only through a reviewed docs PR.
- **`docs/patterns/` holds the living patterns**: folder structure, component composition, data fetching, routing, forms, tables, i18n, and testing. Agents and teammates may add or change a pattern doc when a PR establishes or changes that pattern, in the same PR, and say so in the PR body. Follow the `ui-patterns` skill. When a pattern doc and this file disagree, this file wins; fix the pattern doc.

Read the pattern doc for the area you are touching before writing code:

| Working on                           | Read                                |
| ------------------------------------ | ----------------------------------- |
| Where a file goes, naming            | `docs/patterns/folder-structure.md` |
| Components, styling, shadcn, theming | `docs/patterns/components.md`       |
| Calling the API, caching, mutations  | `docs/patterns/data-fetching.md`    |
| Routes, search params, guards        | `docs/patterns/routing.md`          |
| Forms and validation                 | `docs/patterns/forms.md`            |
| Tables and lists                     | `docs/patterns/tables.md`           |
| User-facing text                     | `docs/patterns/i18n.md`             |
| Tests                                | `docs/patterns/testing.md`          |

## Stack

| Layer           | Choice                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework       | React 19 with the React Compiler (`babel-plugin-react-compiler` 1.0 through `@rolldown/plugin-babel`)                                                  |
| Language        | TypeScript 7, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`                                                                             |
| Build           | Vite 8, single-page app; dev server on :3000 proxies `/api` to the server on :1338                                                                     |
| Package manager | pnpm 10 (`packageManager` pins it); never yarn, npm, or npx                                                                                            |
| Lint / format   | Oxlint with type-aware rules (`.oxlintrc.json`) and oxfmt (`.oxfmtrc.json`: single quotes, semicolons, width 100, sorted imports and Tailwind classes) |
| Styling         | Tailwind v4 + shadcn/ui (Radix, `radix-nova` style), theme tokens as CSS variables in `src/styles.css`                                                 |
| Theme           | `next-themes`, class strategy, dark by default, light and system available                                                                             |
| Routing         | TanStack Router, file-based under `src/routes/`; `src/routeTree.gen.ts` is generated, never edit it                                                    |
| Server data     | TanStack Query                                                                                                                                         |
| Forms           | TanStack Form + Zod 4                                                                                                                                  |
| Tables          | TanStack Table v9                                                                                                                                      |
| i18n            | i18next + react-i18next; English (`en`) and Traditional Chinese (`zh-Hant`)                                                                            |
| Icons / fonts   | lucide-react; font tokens (`--typeface-sans`, `--typeface-mono`, `--typeface-lyrics`) on system stacks until the designer picks typefaces              |
| Tests           | Vitest + Testing Library on jsdom                                                                                                                      |

Majors only above. `package.json` is the source of truth for exact versions.

## Commands

```bash
pnpm install                    # install (pnpm 10; corepack or a matching global pnpm)
pnpm dev                        # Vite on :3000; run the server too (cd ../server && pnpm dev)
pnpm typecheck                  # tsc (TypeScript 7) for src/ and vite.config.ts; 0 errors required
pnpm lint                       # oxlint --type-aware --deny-warnings; 0 problems required
pnpm format                     # oxfmt: format in place; `pnpm format:check` is what CI runs
pnpm test                       # Vitest once; `pnpm test:watch` while developing
pnpm build                      # typecheck, then vite build → ui/dist
pnpm exec shadcn add <name>     # add a shadcn component into src/components/ui/
pnpm exec tanstack search-docs "<query>" --library router --framework react  # TanStack docs
```

## Rules

- **TypeScript:** no `any`, no non-null `!`, no `as` casts to silence the compiler. Parse anything from outside the app (API responses, search params, storage) with Zod; `apiRequest` requires a schema for exactly this reason.
- **React Compiler:** write plain components and hooks; do not add `useMemo`, `useCallback`, or `memo` for performance, since the compiler memoizes. Keep components pure: no reads or writes of refs during render, no setState during render, and effects only for syncing with something outside React. Oxlint's react rules catch most violations.
- **Imports:** use the `@/` alias for anything outside the current feature folder; oxfmt sorts imports.
- **Components:** shadcn components in `src/components/ui/` are vendored code that the shadcn CLI writes; prefer composing them over editing them, and keep any edit small and noted in the PR. They are excluded from lint.
- **Styling:** Tailwind utilities and theme tokens only (`bg-background`, `text-muted-foreground`, `border-border`, …). No inline `style`, no hex or `oklch` values outside `src/styles.css`. Need a new colour? Add a token to `src/styles.css` for both light and dark, then use it.
- **Text:** every user-facing string goes through `t()` with a key in both `src/i18n/locales/en.json` and `src/i18n/locales/zh-Hant.json`; the locale parity test fails otherwise. Never render server error text; map status codes to keys.
- **Data:** go through `apiRequest` (`src/lib/api-client.ts`) and TanStack Query; never call `fetch` directly from components, and never cache server data in React state or a store. Auth calls go through `src/lib/auth-client.ts`.
- **Access:** route guards are UX only; the server's `ROUTE_PERMISSIONS` and ownership checks are the real gate. Change both sides together.
- **Personal data:** never in logs, tests, fixtures, screenshots, or commits. Tests use obvious dummy data.
- **Phones first:** every screen must work at 390 px wide and on desktop; the app is used on phones during worship. One responsive component, never a separate mobile twin.

## Auth

- `src/lib/auth-client.ts` talks to the server's `/api/auth/*` proxy with `fetch`: `fetchSession()` (`get-session`, returns the user and the API JWT from `set-auth-jwt`), `authClient.signInWithEmail`, `signInWithGoogle(nextPath)` (redirects to Google, which returns through `/api/auth-callback?next=<path>`), `signUp`, `requestPasswordReset`, `resetPassword`, `signOut`. Errors are `AuthError` with `status` and Better Auth's `code`.
- `src/lib/api-client.ts` caches the JWT in memory until a minute before `exp` and adds `Authorization: Bearer <token>`; `clearAuthToken()` resets it on sign-in and sign-out.
- `src/features/auth/session.ts` exposes `sessionQueryOptions` (session plus the caller's ownership record, created on first sign-in) as the single source of who is signed in. The `/_app` layout route requires it in `beforeLoad` and passes `session` down through route context.

## Verification before you call a change done

1. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` all pass.
2. Open the change in a browser at 390 px and desktop width, in light and dark, in English and 繁體中文. Check the console for errors.
3. The PR body lists any pattern doc you changed.

## MCP servers and doc tools

- **shadcn MCP** (browse, search, and install registry components) and **Context7** (current docs for React, TanStack, Tailwind, Zod, Vite) are configured for Claude Code (`.mcp.json`), Cursor (`.cursor/mcp.json`), VS Code / Copilot (`.vscode/mcp.json`), and OpenCode (`opencode.json`) at the repo root.
- **Codex** reads MCP servers from `~/.codex/config.toml` only. Add:

  ```toml
  [mcp_servers.shadcn]
  command = "pnpm"
  args = ["dlx", "shadcn@latest", "mcp", "--cwd", "ui"]
  
  [mcp_servers.context7]
  url = "https://mcp.context7.com/mcp"
  ```

- **TanStack** has no MCP server; use `pnpm exec tanstack search-docs` / `pnpm exec tanstack doc` from `ui/`.
