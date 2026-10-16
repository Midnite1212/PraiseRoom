# Routing

Reference: `src/routes/`.

- **File-based routes.** `pnpm dev` and `pnpm build` regenerate `src/routeTree.gen.ts`; commit it, never edit it.
- **Signed-in pages** live under `src/routes/_app/`. The `_app` layout's `beforeLoad` ensures the session and redirects to `/login?redirect=<current href>` when signed out, then returns `{ session }` into route context.
- **Signed-out pages** (`login.tsx`) sit beside `_app` and redirect a signed-in user to `toSafeRedirect(search.redirect)`. Always pass redirect targets through `toSafeRedirect`, which only allows same-origin paths.
- **Access types:** gate editor or admin pages in that route's `beforeLoad`, using the session from context (for example `canWriteSongs(context.session)`), and redirect or throw `notFound()`. This is UX only; the server enforces access.
- **Search params:** declare them with a Zod schema in `validateSearch`, using `.default(...)` so links can omit them and `.catch(...)` so a bad URL falls back instead of erroring. Read them with `Route.useSearch()`; change them with `Route.useNavigate()({ search })`.
- **Data:** `loaderDeps: ({ search }) => search` plus a `loader` that calls `ensureQueryData` (see `data-fetching.md`). Give slow routes a `pendingComponent` skeleton.
- **Missing records:** for a detail route (`/setlists/$setlistId`), the loader turns an `ApiError` 400 or 404 into `throw notFound()`, so a bad id shows the not-found screen instead of the error screen; the component then reads the data with `useSuspenseQuery`.
- **Keyboard shortcuts** (such as ← and → to change songs) are a window `keydown` listener in an effect that ignores inputs, selects, and editable elements, and changes search params with `replace: true` so they don't flood history.
- **Links:** use `<Link to="/songs">` (type-checked). For shadcn buttons, wrap with `<Button asChild><Link …/></Button>`.
