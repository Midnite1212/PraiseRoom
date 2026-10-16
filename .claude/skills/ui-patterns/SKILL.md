---
name: ui-patterns
description: How to add or change a pattern doc in ui/docs/patterns/ — the editable guardrails for the new UI's component patterns, folder structure, data fetching, routing, forms, tables, i18n, and testing. Use whenever a change in ui/ introduces a new pattern, replaces an existing one, or finds a pattern doc out of date.
---

# ui-patterns

`ui/docs/patterns/` is where the new UI's conventions live and evolve. You may edit these docs; `ui/AGENTS.md` and the root `AGENTS.md` are fixed and change only through a reviewed docs PR.

## When to update a pattern doc

- Your change introduces a way of doing something the docs don't cover yet (a first mutation, a first dialog flow, a first route guard by access type).
- Your change replaces how the docs say to do something, because the old way no longer works or a better one is now the precedent.
- You find a doc that no longer matches the code.

Do not update a doc for a one-off; a pattern is something the next screen should copy.

## How

1. Make the code change first, so the doc can point at real code.
2. Edit the matching doc in `ui/docs/patterns/` (or add one and list it in `ui/docs/patterns/README.md` and the table in `ui/AGENTS.md`). Keep the doc's shape: short rules, each with the reason only when it isn't obvious, and a reference file path.
3. Never contradict `ui/AGENTS.md` or the root `AGENTS.md`. If a fixed rule blocks a good pattern, stop and raise it instead of working around it.
4. In the same PR, add a line to the PR body: `Pattern docs: <file> — <what changed>`.
5. Reviewers check pattern-doc changes like code: does the reference file actually do what the doc says?
