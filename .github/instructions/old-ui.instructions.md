---
applyTo: 'old-ui/**'
---

# Old UI (`old-ui/`)

Frozen except for fixes; new screens go in `ui/`. Follow `old-ui/AGENTS.md`.

- yarn only. Check with `yarn typecheck`, `yarn test`, `yarn build` in `old-ui/`, and `yarn lint` from the root.
- MUI v5 and react-router v6 APIs only; `customAxios` for API calls; theme palette values instead of hex colours; edit both halves of any desktop/`*Mobile.tsx` pair.
