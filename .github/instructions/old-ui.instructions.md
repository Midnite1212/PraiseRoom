---
applyTo: 'old-ui/**'
---

# Old UI (`old-ui/`)

No longer deployed and frozen; it is the reference for screens not yet rebuilt in `ui/`. Follow `old-ui/AGENTS.md`.

- pnpm only. Check with `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format:check`, and `pnpm build` in `old-ui/`.
- MUI v5 and react-router v6 APIs only; `customAxios` for API calls; theme palette values instead of hex colours; edit both halves of any desktop/`*Mobile.tsx` pair.
