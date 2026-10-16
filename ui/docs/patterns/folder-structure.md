# Folder structure

```
src/
  main.tsx                 providers: theme, query client, router, tooltips, toasts
  router.tsx               router instance and its context type ({ queryClient })
  routes/                  file-based routes (TanStack Router); routeTree.gen.ts is generated
    __root.tsx             root layout, not-found and error screens, dev-only devtools
    _app.tsx               signed-in layout: session guard + AppShell
    _app/<page>/index.tsx  signed-in pages
    login.tsx              signed-out pages sit beside _app
  features/<feature>/      everything one feature owns: api.ts, components, schemas, hooks
  components/ui/           shadcn components (vendored; added with `pnpm exec shadcn add`)
  components/layout/       app shell pieces shared by every page
  hooks/                   hooks used by more than one feature
  lib/                     framework-free helpers: api and auth clients, query client, utils
  i18n/                    i18next setup and locale files
  test/                    Vitest setup
```

- File names are kebab-case (`songs-table.tsx`); components are PascalCase named exports (`export function SongsTable`). Route files export `Route`.
- A route file wires data and layout; the UI it renders lives in `features/<feature>/`. Keep route files short.
- Something moves from `features/<feature>/` to `components/` or `hooks/` when a second feature needs it, not before.
- Tests sit next to the file they test as `<name>.test.ts(x)`.
