---
name: code-review
description: When asked for "code review" of the current branch or a PR in praise-room.
---

- Treat the branch as a feature branch with an open PR. Compare it against its **PR base**: `main` by default, or the parent branch for a stacked PR. Find the base with `gh pr view --json baseRefName` if a PR is open, else ask.
- Review the branch's own changes only and decide whether it is ready to merge into that base.
- Review as if you are the engineering lead who has to maintain this after the volunteers move on.
- Use `git diff origin/<base>...HEAD` for the complete set of changes; never rely on individual commit diffs.
- Always review against the final state of the files, and read the actual current file contents rather than trusting the diff hunk.
- Do not point out issues already resolved in the final state of the branch.
- Do not make code changes.

## What to look for here specifically

Review each changed file in `ui/` against `ui/AGENTS.md` and `ui/docs/patterns/`, and each file in `server/` against the backend section of `AGENTS.md`.

### UI (`ui/`)

The bar is the written standard, not "better than before".

- Fixed rules from `ui/AGENTS.md`: no `any`, `!`, or silencing `as`; outside data parsed with Zod; no manual `useMemo`/`useCallback`/`memo` for performance (React Compiler); render stays pure; no inline styles or raw colours outside `src/styles.css`; data only through `apiRequest` and TanStack Query; every string through `t()` with keys in both locales; one responsive component, no mobile twin.
- Patterns: the change follows `ui/docs/patterns/`, or updates the matching doc in the same PR and says so in the PR body. A pattern doc must not contradict `ui/AGENTS.md`, and its reference file must actually do what it says.
- Routes: search params validated with Zod, redirect targets through `toSafeRedirect`, access-gated routes guarded in `beforeLoad` with the matching server rule in place.
- shadcn files in `src/components/ui/` changed only when unavoidable, and noted.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` in `ui/` are clean.

### Server (`server/`)

- A new endpoint has a route line and a `ROUTE_PERMISSIONS` entry; writes check that `req.user` owns the target; `req.body` is picked, not passed to a repository; an update for a missing id returns 404; reads and updates filter `is_deleted`; `error.message` is not sent to the client; user text in `ilike` goes through `containsPattern`.
- Checks: `pnpm typecheck`, `pnpm lint`, and `pnpm test` in `server/` are clean.

### Both

- No member data in the diff, fixtures, or screenshots.

## Output

- List issues with code examples to fix them; show the existing code alongside the suggested fix.
- Summarise with a score out of 10 and whether it should merge.
- Draft a copyable PR title and description:
  - Title per `.claude/docs/commit-convention.md`: `GH-<issue#>: <what the branch does>`. Take the issue number from the branch name prefix (`187-folder-fix` → `GH-187`), falling back to the commit prefixes.
  - Description per `.claude/docs/pr-description.md`, opening with `Closes #<issue#>`.
  - Fill the Changes table and Verification list from what you actually reviewed; leave the Screenshots table in place for the author to fill.
