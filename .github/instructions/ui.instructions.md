---
applyTo: 'ui/**'
---

# New UI (`ui/`)

Follow `ui/AGENTS.md` (fixed rules) and the matching doc in `ui/docs/patterns/` (living patterns; update it in the same PR when you change a pattern).

- pnpm only. Check with `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`.
- No `any`, `!`, or silencing `as`; parse outside data with Zod. No manual `useMemo`/`useCallback`/`memo` for performance (React Compiler).
- Data through `apiRequest` (`src/lib/api-client.ts`) and TanStack Query option factories in `src/features/<feature>/api.ts`.
- Routes are files under `src/routes/`; signed-in pages under `_app/`; search params validated with Zod; never edit `src/routeTree.gen.ts`.
- shadcn components from `src/components/ui/`; Tailwind classes and theme tokens only; every string through `t()` with keys in both `en.json` and `zh-Hant.json`.
- One responsive component that works at 390 px and on desktop.
