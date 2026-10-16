# Old UI (`old-ui/`) — rules for agents

> Read the root `AGENTS.md` first; its Mandatory Procedure, commit rules, server rules, and data handling apply here too. This file covers `old-ui/` only, and nested-`AGENTS.md`-aware tools load it for files under this folder. `old-ui/CLAUDE.md` is a symlink to this file.

`old-ui/` is the previous UI and is **no longer deployed**; production serves the rebuilt `ui/`. It stays as the reference for screens not yet rebuilt and is **frozen**: no new features, refactors, or dependency upgrades. New screens go in `ui/` (see `ui/AGENTS.md`).

## Stack

- React 18, TypeScript (`strict`, `noImplicitAny`, `noImplicitReturns`), Vite 8 + Vitest 5, MUI 5 (`@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers` 6) on Emotion, Redux Toolkit 1 + redux-persist, react-router-dom 6, axios 1, react-hook-form 7 + zod 3 via `@hookform/resolvers`, dayjs. Fonts: Work Sans and DM Sans through `@fontsource`.
- Majors only. `old-ui/package.json` is the source of truth for exact versions. Installs use **pnpm** with `old-ui/pnpm-lock.yaml`.

## Commands

```bash
cd old-ui && pnpm install       # install
pnpm dev                        # Vite on :3000; /api is proxied to the server on :1338 (changeOrigin: false)
pnpm typecheck                  # tsc --noEmit; 0 errors required
pnpm test                       # Vitest unit tests (jsdom, globals); all must pass
pnpm build                      # tsc --noEmit, then vite build → old-ui/dist (not deployed)
pnpm preview                    # serve old-ui/dist locally
```

Lint and format from `old-ui/`: `pnpm lint` (oxlint, 0 problems) and `pnpm format` (oxfmt).

- Unit tests cover pure logic only: chord parsing and transposition, lyrics helpers, song codes, `songKeys`, the store reset, and the response cache (`old-ui/src/**/*.test.ts(x)`). Components have no render tests; verify them with type-check, lint, build, and the browser.

## Working in a Messy Codebase

Most of `old-ui/src/components/` was written by junior volunteers over several sprints and it shows: 500–1100-line container files, close to 300 inline hex colours, hard-coded pixel sizes, separate `*Mobile.tsx` twins of desktop components, `any` used to silence the compiler, three different ways of fetching the same list, and copy-pasted controller helpers on the server. That is the starting point, not the standard.

- **Small edits match the file they are in.** Do not reformat, rename, or restructure code you were not asked to touch. A diff that mixes a fix with a cleanup is harder to review and to revert.
- **New code follows the standards in this file.** New files and components are where the bar is raised. Never copy a bad pattern into a new file because a neighbour has it.
- **Search before you build.** Read `old-ui/src/components/custom/` (shared dialogs, inputs, headers), `old-ui/src/helpers/`, and the sibling feature folder first. A component may already exist under a different name (`ConfirmationDialog`, `HelpDialog`, `AutocompleteInput`, `HeaderWithIcon`, `SongPreviewModal`).
- **Extract only on the second use.** A component moves to `components/custom/` when a second feature needs it, not to tidy one file.
- **Name your precedent.** When two existing implementations conflict, say which file you followed and why. If neither is fit, say so and propose the smaller change.
- **Cleanups are their own issue and PR.** If something is bad enough to fix, open an issue and do it separately.

## Architecture (`old-ui/src/`)

| Path                               | Role                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                        | Entry: React 18 `createRoot` → `StrictMode` → `App`                                                                                                     |
| `App.tsx`                          | Redux `Provider` → MUI `ThemeProvider` + `CssBaseline` → `BrowserRouter`; maps `routes.ts` into `<Route>`s, each wrapped in `PrivateRouteWrapper`       |
| `routes.ts`                        | The single route table: `{ key, title, path, enabled, component, permissions }`                                                                         |
| `components/<feature>/`            | Feature UI: `auth/`, `home/`, `song/`, `songsView/`, `setlist/`, `setlistView/`, `profile/`, `navigation/`. Route-level components end in `Container`   |
| `components/setlist/hooks/`        | Setlist-only hooks (song search, folder members, tabs data, folder drawer)                                                                              |
| `components/custom/`               | Shared building blocks plus `PrivateRouteWrapper.tsx`, `ErrorPage.tsx`, `SessionProvider.tsx`, `authClient.ts` (Neon Auth client), and `customAxios.ts` |
| `components/utility/`              | Cross-feature modals (`SongPreviewModal`)                                                                                                               |
| `helpers/customHooks.ts`           | `useUser`, `useSongs`, `useOwnership`, `useOwnedSetlists`                                                                                               |
| `helpers/song/`, `helpers/global/` | Pure helpers (lyrics preview, first line, chord parsing, date format) behind `index.tsx` barrels                                                        |
| `reducers/`                        | RTK slices: `songs`, `ownership`, plus `sessionSlice.ts`'s bare `signout` action; barrel in `reducers/index.tsx`                                        |
| `store.ts`                         | `configureStore`; nothing is persisted (`whitelist: []`); `signout` resets every slice; exports `RootState` and `useAppSelector`                        |
| `types/`                           | Shared types: `song`, `setlist`, `ownership`, `user`, `form`                                                                                            |
| `constants.ts`                     | Music keys, tempo, themes, `ChordColors`, layout heights and widths                                                                                     |
| `theme.ts`                         | MUI theme: palette (incl. custom `darker` / `lighter` shades via module augmentation), typography, component overrides                                  |
| `vite-env.d.ts`                    | Vite client types and Vitest globals; no custom `VITE_*` env vars remain                                                                                |

Imports are **relative** (`'../../helpers/customHooks'`). The `#/*` alias in `old-ui/tsconfig.json` is mirrored in `vite.config.ts` and resolves at runtime, but the codebase uses relative imports; do not add new `#/` imports.

## Frontend Code Standards

### File organisation

- Feature components in `components/<feature>/`, PascalCase file names, one default-exported component per file.
- Shared components (2+ features) in `components/custom/`. Non-UI logic in `helpers/`. Types used by more than one file in `types/`.
- Do not create a new top-level folder under `old-ui/src/` without asking.
- `customAxios.ts` sits in `components/custom/` for historical reasons. Import it from there; do not add a second client.

### Imports

```tsx
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Stack, Typography } from '@mui/material';
// 1. React and external packages
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useOwnership } from '../../helpers/customHooks';
import { SongSchema } from '../../types/song.types';
// 2. Local modules (relative)
import { customAxios as axios } from '../custom/customAxios';
```

Import MUI icons by path (`@mui/icons-material/Delete`), not from the package root, to keep dev builds fast.

### Component shape

```tsx
type SongDeleteDialogProps = {
  open: boolean;
  songId?: string;
  onClose: () => void;
};

const SongDeleteDialog = ({ open, songId, onClose }: SongDeleteDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {};

  return <Box>…</Box>;
};

export default SongDeleteDialog;
```

### Naming

- Components and types `PascalCase`; functions, props, and variables `camelCase`; true constants `UPPER_SNAKE_CASE` (older constants in `constants.ts` are camelCase; leave them).
- Booleans `is/has/should`; event props `on*`; handlers `handle*`.
- Props types are `<Component>Props`.

### TypeScript

- No new `any`. Type API responses with the types in `types/` (`axios.get<SongSchema[]>(…)`) and use `unknown` plus narrowing in `catch`. Oxlint enforces `no-explicit-any` as an error.
- No non-null assertions (`!`) on fetched data or env vars in new code; guard instead.
- No `as` casts to paper over a wrong type. Fix the type.
- `old-ui/tsconfig.json` is strict. Keep `pnpm exec tsc --noEmit` at 0 errors.

### Preferences

- Functional components with hooks; arrow functions; `const`/`let`; async/await.
- Ternary for either/or rendering, `&&` only for render-if-true with a boolean left side (`items.length > 0 &&`, never `items.length &&`), complex conditions extracted to a named `const`.
- Stable `key`s from data (`song._id`), not array indexes, for any list that can reorder, filter, or change.
- `useEffect` dependency arrays must be complete. `react-hooks/exhaustive-deps` is at 0 warnings and `pnpm lint` runs with `--max-warnings=0`; fix the effect or move the function inside it.
- Reuse library code over hand-rolled logic: dayjs for dates, zod for validation, MUI components over custom HTML.
- Produce valid HTML. MUI `Typography` renders `<p>` by default; nesting it inside a `Button` or another `Typography` yields invalid DOM. Use the `component` prop.
- Default to no comments. If a line needs explaining, rename the symbol. A comment is for a _why_ the code cannot say.

### Forms

- Local state for one or two fields.
- **react-hook-form + zod** (`zodResolver`) for anything larger, following `components/auth/LoginContainer.tsx`. Shared validators in `components/auth/helpers/zod.validators.ts`.
- Do not keep a second copy of form values in `useState` alongside RHF. `SongEditorContainer.tsx` does this and is flagged for refactor; do not copy it.

## MUI and Styling

- MUI **v5** API only. No v4 (`makeStyles`, `withStyles`, `@material-ui/*`) and no v6/v7 names (`Grid2` props from v7, `slotProps` shapes that v5 does not accept).
- Use the `sx` prop for one-off styles and `styled()` with **object syntax** for a styled element reused within a file. No inline `style={{}}`.
- Use theme values, not raw ones: `color="primary.main"`, `bgcolor="secondary.main"`, `theme.palette.primary.darker`, spacing numbers (`p: 2`), `theme.breakpoints`. The palette in `theme.ts` already defines the purple/dark scheme used across the app.
- Need a colour the theme lacks? Add it to `theme.ts` as a palette token, then use the token. Do not add new inline hex values. Material 3 role tokens already exist beyond the MUI defaults: `surface.{container,containerHigh,containerHighest,containerActive}`, `outline.{main,variant}`, `onSurface.{variant,secondary,neutral}`, `onPrimary.main`, `onSecondaryContainer.main`, `switchTrack.checked`, `scrollbar.thumb`. Never change an existing palette value to fit one screen; MUI derives defaults from them. String paths (`"outline.main"`) resolve only in `sx` keys and system props; inside `styled()`, `border`/`background` shorthands, and `InputProps.style`, use `theme.palette.x.y`.
- Layout sizes shared across files (sidebar width, header heights) live in `constants.ts`. Use them instead of repeating `'80px'`.
- Responsive props over media queries: `width={{ xs: '100%', md: '50%' }}`. Use `useMediaQuery(theme.breakpoints.up('sm'))` for logic, not a hard-coded `'(min-width:600px)'`.
- Every page renders on desktop and mobile; the app is used on phones during worship. Check both before calling a layout done. Prefer one responsive component over a new `*Mobile.tsx` twin; when you must edit an existing twin, edit both.
- Don't hoist a style object used once. Hoist only when reused, toggled conditionally, or passed to a memoized component.

## Data and API

```tsx
import { customAxios as axios } from '../custom/customAxios';

const fetchSong = async () => {
  try {
    const { data } = await axios.get<SongSchema>('/api/songs/get', { params: { id } });
    setSong(data);
  } catch (err) {
    logRequestError('Error fetching song:', err);
    setErrorMessage('Could not load this song. Please try again.');
  }
};
```

- Always use `customAxios`. It is one `axios.create()` instance (`components/custom/customAxios.ts`) with a request interceptor that attaches `Authorization: Bearer <token>` from `getAuthToken()` in `authClient.ts`, caching the token in memory until shortly before its 15-minute `exp` and skipping the header entirely when signed out. The same instance coalesces identical GETs (same url, params, and `Authorization`) into one request and reuses the response for 30 seconds, handing each caller its own copy; any non-GET request clears that response cache, and so does `clearAuthTokenCache()` (called on sign-out). Requests that pass their own `validateStatus` bypass it. Both caches are module-level state.
- API paths: `/api/<resource>/<action>` for this server, including `/api/auth/*` (Better Auth proxy) and `/api/auth-callback` (Google OAuth callback). There is no `/external-api` proxy; the main HMCC HK site is not called from this repo.
- Log request failures with `logRequestError(context, err)` from `helpers/global`. Never `console.log`/`console.error` a raw axios error: its `config.headers` carries the user's JWT.
- Every request handles failure visibly. Mutations show a Snackbar on success and on failure (see `SetlistFolderDetail.tsx` for the pattern). Never show a success message without checking the result. Never render the raw server error string.
- Lists and records from the API can be empty, missing fields, or `null` (`publicLink`, `date`, `code`, `simplifiedChordLyrics`). Guard with `?.` and `Array.isArray` before `.map`.
- `GET /api/setlists/get` without an id returns only setlists the caller can edit; load a folder's setlists by id (`params: { id: folder.setlistIds }`). Prefer fetching what a page needs with query params (`/api/setlists/get?id=…`) over pulling every record into Redux. Do not add a Redux cache for setlists or folders; fetch them where they are used.

## Routing and Access

- react-router-dom **v6**: `<Routes>`, `<Route element={…}>`, `useNavigate`, `useParams`, `<Navigate replace>`. No v5 APIs (`Switch`, `useHistory`, `props.history`, `component=` on `Route`).
- Every route is an entry in `old-ui/src/routes.ts`; `App.tsx` wraps each in `PrivateRouteWrapper`. Never add a bare `<Route>` in a component.
- Each entry needs a **unique `key`** and a path that does not shadow another. `/setlist/:id?` and `/setlist/details/:id?` overlap; check ordering and v6 ranking when adding setlist paths.
- `permissions` values handled by `PrivateRouteWrapper`: `'noUser'` (logged-out only, redirects home when logged in), `'user'` (any logged-in user, redirects to `/login`), `'editor'` (logged in and `accessType` is `editor` or `admin`, matching the server's `SONG_WRITERS`; used by the song add/edit routes), `'admin'` (`user.accessType === 'admin'`), `'public'` (anyone; logged-in users see it without the nav bar). An unknown path falls through to the `*` route (`ErrorPage`). Read the wrapper before adding a new combination.
- Frontend gating is UX only. The real check is `ROUTE_PERMISSIONS` on the server. Say so when a task touches access, and change both sides together.

## State

- Redux holds: `songs`, `ownership`. Nothing is persisted to localStorage (redux-persist `whitelist: []`); both slices are refetched on load. The session itself lives in Neon Auth's HTTP-only cookies on this origin, not Redux. `signout()` (from `reducers/sessionSlice.ts`) resets every slice; pair it with `persistor.purge()` on logout.
- Use `useOwnership()` for the current user's ownership record and `useUser()` for the signed-in profile (`{ id, email, fullName, accessType }`). `useUser()` reads the session that `SessionProvider` (`components/custom/SessionProvider.tsx`, mounted once in `App.tsx`) loads on app start; call its `refreshSession()` after anything that changes who is signed in.
- `RootState` and `useAppSelector` come from `store.ts`. Use `useAppSelector` in new code.
- Do not add a slice unless the state is genuinely cross-page. Page state stays in the component.
- Never put new personal data into Redux; it ends up in localStorage.

## Chord Lyrics Format

Songs store `chordLyrics` (and optional `simplifiedChordLyrics`) as one plain-text string:

```
{Verse 1}
[G]Amazing [C]grace how [G]sweet the sound
{Chorus}
[C]My chains are [G]gone
```

- `{Section}` on its own line starts a block; `[Chord]` sits inline before the syllable it lands on.
- Parsing helpers live in `helpers/song/` and `helpers/global/common.tsx` (`findFirstLetterLyrics`, `isChordLyricsBlockEmpty`). Rendering and transposition live in `components/songsView/SongsLyrics.tsx` and `components/setlistView/SetlistViewSongDisplay.tsx`.
- Transposition indexes into `sharpMusicKeysOptions` / `flatMusicKeysOptions` in `constants.ts`; chord colours come from `ChordColors`. Reuse these; do not add a third key table.
- Lyrics are user-entered text. Render them as text nodes, never with `dangerouslySetInnerHTML`.

## Auth in the old UI

- `old-ui/src/components/custom/authClient.ts` is a small axios client for this app's own `/api/auth/*` (Better Auth endpoints: `get-session`, `sign-in/email`, `sign-in/social`, `sign-up/email`, `request-password-reset`, `reset-password`, `sign-out`); the UI does not use the Neon Auth SDK, which would add about 550 kB. `getAuthToken()` reads the API JWT from the `set-auth-jwt` header of `get-session`. The server's `server/src/auth/neonAuth.routes.ts` proxies every `/api/auth/*` request to `NEON_AUTH_BASE_URL` (first-party cookies, works under Safari ITP) and `GET /api/auth-callback?next=<path>` finishes Google OAuth (exchanges the verifier, sets session cookies, redirects to `next`).
- The auth screens (`components/auth/*Container.tsx`) call the Better Auth client directly: `authClient.signIn.email`, `authClient.signIn.social({ provider: 'google', callbackURL: '<origin>/api/auth-callback?next=<path>' })` (the client sends the browser to the returned Google URL), `authClient.signUp.email`, `authClient.requestPasswordReset({ email, redirectTo })`, `authClient.resetPassword({ newPassword, token })`. Every call resolves `{ data, error }` rather than throwing; never render `error.message` (it is server text), map `error.status` to a fixed safe string instead.
- `SessionProvider` calls `authClient.getSession()` once on app start (and again on `refreshSession()`, which email sign-in awaits before the `noUser` route sends the user to `location.state.from` or `/`) for the signed-in identity, then loads or creates the user's `Ownership` record from `/api/ownerships/get` / `/api/ownerships/create`, and `useUser()` (`helpers/customHooks.ts`) returns `{ id, email, fullName, accessType }` built from the session plus the ownership's `accessType`. There is no token in Redux; `customAxios`'s interceptor gets the bearer token from `getAuthToken()` (see `#data-and-api`).
- Sign-out calls `authClient.signOut()`, then `clearAuthTokenCache()`, then `persistor.purge()`, then dispatches `signout()` (see `ProfileView.tsx`).

## Old UI gotchas

1. There is no `user` slice in Redux any more; the session lives in Neon Auth's cookies. Use `useUser()` for the profile, never a Redux selector.
2. `customAxios`'s interceptor gets the token from `getAuthToken()` (cached until near `exp`); there is no `updateAxiosClient` to call after sign-in.
3. `#/` imports resolve through the Vite alias, but the codebase uses relative imports. Keep to that.
4. `useUser()` reads shared context and never fetches; the session loads once in `SessionProvider`, so a signed-in state change must go through `refreshSession()` or a full page load.
5. `pnpm build` in `old-ui/` runs `tsc --noEmit` before `vite build`, so a type error fails the `ui` deploy. `old-ui/.oxlintrc.json` keeps the rules the old ESLint config enforced (correctness, hooks, `no-explicit-any`) and turns off the React Compiler rules this frozen code was never written for.
6. Route `key`s in `routes.ts` must be unique, and React keys from data (`_id`), not indexes.

- MUI docs: use the MUI MCP server (`useMuiDocs`, then `fetchDocs` with only the URLs it returns) when it is available, and pin answers to v5.
