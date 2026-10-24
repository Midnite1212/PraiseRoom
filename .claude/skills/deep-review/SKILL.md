---
name: deep-review
description: When asked for "deep review" or "deep code review" of a branch or PR in praise-room.
---

This is a thorough code review that goes beyond surface-level changes to ensure the PR will not introduce bugs or break existing functionality.

## Step 1: Identify PR-specific changes

- Determine the PR base: `gh pr view --json baseRefName` if a PR is open, else `main`.
- Isolate the branch's own commits: `git log --oneline origin/<base>..HEAD --grep="GH-<issue#>"`, or walk first-parent commits. Exclude merges from the base.
- List files changed by those commits only; ignore changes that arrived by merging the base.

## Step 2: Standard Review (same as /code-review)

- Run everything in `.claude/skills/code-review/SKILL.md`, including its "what to look for here" list.
- `git diff origin/<base>...HEAD` for the complete change set; review the final state of files, not individual commits.

## Step 3: Deep Analysis - Potential Bugs

### UI checks (`ui/`)

- `pnpm typecheck`, `pnpm lint` (type-aware), `pnpm format:check`, `pnpm test`, and `pnpm build` pass in `ui/`; no `any`, `!`, silencing `as`, or `oxlint-disable` added to get there.
- Every API response is parsed by a Zod schema through `apiRequest`; query keys come from the feature's `queryOptions` factory; mutations invalidate the right keys and toast both outcomes.
- Search params validated with Zod (`.default` + `.catch`); redirects go through `toSafeRedirect`; access-gated routes check the session in `beforeLoad` and the server rule matches.
- React Compiler safety: no manual memoization for performance, no ref reads or setState during render, effects only for external sync.
- Every new string has keys in both `en.json` and `zh-Hant.json`; no server text rendered.
- Styling uses tokens only; new colours are added to `src/styles.css` for light and dark; layout works at 390 px.
- Pattern changes are written to `ui/docs/patterns/` in the same PR, do not contradict `ui/AGENTS.md`, and match their reference code.
- Fetched arrays and nullable fields are guarded; loading, empty, and error states are rendered.
- Chord-lyrics parsing changes tested against a song with `{Section}` blocks, inline `[Chord]`s, a chords-only intro, and an empty `simplifiedChordLyrics`.
- Path changes do not break existing links or public setlist links already shared (`/setlist/view/:id`).
- If a change is applied to some call sites but not others, grep for the rest and flag the gap. Do not flag pre-existing mess in untouched code; do flag new code that copies it.

### Backend changes (when the PR touches `server/`)

- New endpoint has both a route line and a `ROUTE_PERMISSIONS` entry with the right `requiresAuth` / `allowedAccessTypes`.
- Writes check ownership against `req.user.id`; no trust in `userId` / `accessType` from the body.
- No mass assignment: `create` / `findOneAndUpdate` / `$set` receive picked fields, not `req.body`.
- No `upsert: true` on update endpoints; missing ids return 404.
- Queries filter `isDeleted: false`; user input in `$regex` is escaped; query params are narrowed from `string | string[] | ParsedQs`.
- Error responses are generic; `error.message` stays in server logs.
- Email sending respects `NODE_ENV`; no member data in log lines.

### Breaking Changes

- Removed or renamed exports are not used elsewhere (grep every consumer).
- Response shape changes are matched in every UI caller.
- Stored per-device choices (`createStoredChoice`) still load values saved by older clients.

## Step 4: Cross-Reference Analysis

- For each changed file, identify the files that consume or are consumed by it (GitNexus `impact` / `context` when the index is fresh; grep otherwise).
- Run `detect_changes({scope: "compare", base_ref: "<base>"})` to confirm the affected execution flows match the PR's intent.
- For server changes, `explain({target: "<controller file>"})` to list taint findings from request input to Mongoose.
- Read the actual content of related files, not just diffs, to ensure compatibility.
- Check the change at both phone and desktop widths.

## Step 5: Output Format

### Issues Table

| Severity | File | Line | Issue | Suggested Fix |
| -------- | ---- | ---- | ----- | ------------- |

Severity levels:

- **Critical**: Must fix before merge - will cause runtime errors, data loss, or an access-control hole
- **High**: Should fix - potential bugs or breaking changes
- **Medium**: Recommended - inconsistencies or non-standard patterns
- **Low**: Nice to have - style or minor improvements

### Existing Code vs Suggested Fix

For each issue, show:

```tsx
// Existing code:
<actual code from file>

// Suggested fix:
<corrected code>
```

### Risk Assessment

Rate each area of change:

- Route matching and access gating
- Server permissions and ownership checks
- Query cache and stored per-device choices
- Data fetching and data-shape guards
- Chord parsing and transposition
- Mobile / desktop parity
- Error handling

### Final Score and Recommendation

- Score out of 10
- Clear recommendation: Approve / Request Changes / Block
- Summary of must-fix items

## Step 6: PR Title and Description

Same as /code-review:

- Title per `.claude/docs/commit-convention.md`: `GH-<issue#>: <what the branch does>`, issue number from the branch prefix.
- Description per `.claude/docs/pr-description.md`, opening with `Closes #<issue#>`; fill Changes and Verification from what was reviewed, leave Screenshots for the author.

## Important Notes

- Do not make code changes
- Read actual file contents, not just diffs
- Use grep/glob to find similar patterns across codebase
- Flag any inconsistencies between files changed in this PR
- Consider how changes interact with code NOT in this PR
