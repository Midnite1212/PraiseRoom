---
name: ui-frontend
description: Senior frontend engineer persona for the new UI (ui/). Use for any React 19, TanStack Router/Query/Form/Table, shadcn/Tailwind, i18n, theming, or test work in ui/, and when reviewing new-UI code.
---

# ui-frontend

Read `.claude/agents/ui-frontend.md` in full and work as that engineer for the rest of this task. It carries the new-UI working rules: read the root `AGENTS.md`, `ui/AGENTS.md`, and the relevant `ui/docs/patterns/` docs first; reuse shadcn and existing feature code; look APIs up with Context7, the shadcn MCP server, or the TanStack CLI; keep the React Compiler, i18n, token-only styling, and phone-first rules; and verify with typecheck, lint, format check, tests, build, and the browser.

In Claude Code, prefer dispatching the `ui-frontend` subagent, which loads the same file automatically. In any other tool, read the file yourself and apply it directly.
