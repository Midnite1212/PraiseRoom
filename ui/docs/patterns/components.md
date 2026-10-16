# Components and styling

- **Start from shadcn.** Check `src/components/ui/` first, then the shadcn registry (via the shadcn MCP server or `pnpm exec shadcn add <name>`). Compose those primitives in feature components instead of building controls from `div`s.
- **Don't fork shadcn files for one screen.** Wrap or compose instead. If a shadcn component genuinely needs a project-wide change, keep it small and note it in the PR, since `shadcn add --overwrite` would undo it.
- **Variants:** use `cva` (as shadcn does) for components with variants, and `cn()` from `@/lib/utils` to merge classes.
- **Tokens only:** colours, radii, and fonts come from the CSS variables in `src/styles.css` through Tailwind classes (`bg-card`, `text-muted-foreground`, `rounded-lg`, `font-heading`). Add a new token for both `:root` (light) and `.dark` before using a new colour.
- **Theme:** `next-themes` sets the `dark` class on `<html>`; use `dark:` variants only when a token can't express the difference. `ThemeToggle` is in the app shell.
- **Icons:** `lucide-react`, sized by the component (shadcn sizes icons inside buttons). Icon-only buttons need an `aria-label` from `t()`.
- **Layout:** the app shell (`AppShell`, `AppSidebar`) owns the sidebar, header, and page padding. Pages render inside `<main>` and set their own max width (`mx-auto max-w-5xl`).
- **Responsive:** design at 390 px first, then add `md:`/`lg:` classes. The shadcn sidebar becomes a sheet on phones automatically.
- **Toasts:** `toast.success` / `toast.error` from `sonner` for the result of a user action; inline `Alert` for a page that failed to load.
