# New UI patterns

These docs are the **editable guardrails** for `ui/`. They describe how we build things today, with a reference file for each pattern. When a PR establishes a new pattern or changes one, it updates the matching doc in the same PR and calls the change out in the PR body (see the `ui-patterns` skill). The fixed rules live in `ui/AGENTS.md` and win when the two disagree.

| Doc                                        | Covers                                      | Reference code                       |
| ------------------------------------------ | ------------------------------------------- | ------------------------------------ |
| [folder-structure.md](folder-structure.md) | Where files go and how they are named       | `src/`                               |
| [components.md](components.md)             | Design system, composition, theming         | `src/components/`                    |
| [data-fetching.md](data-fetching.md)       | API calls, query options, mutations         | `src/features/songs/api.ts`          |
| [routing.md](routing.md)                   | File routes, search params, loaders, guards | `src/routes/`                        |
| [editors.md](editors.md)                   | Autosave editor frame, undo, reorder        | `src/components/editor/`             |
| [forms.md](forms.md)                       | TanStack Form with Zod and shadcn fields    | `src/routes/login.tsx`               |
| [tables.md](tables.md)                     | TanStack Table v9 with shadcn's table       | `src/features/songs/songs-table.tsx` |
| [i18n.md](i18n.md)                         | Translation keys and languages              | `src/i18n/`                          |
| [testing.md](testing.md)                   | What to test and how                        | `src/**/*.test.ts(x)`                |
