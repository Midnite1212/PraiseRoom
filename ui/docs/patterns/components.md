# Components and styling

- **Start from shadcn.** Check `src/components/ui/` first, then the shadcn registry (via the shadcn MCP server or `pnpm exec shadcn add <name>`). Compose those primitives in feature components instead of building controls from `div`s.
- **Don't fork shadcn files for one screen.** Wrap or compose instead. If a shadcn component genuinely needs a project-wide change, keep it small and note it in the PR, since `shadcn add --overwrite` would undo it.
- **Variants:** use `cva` (as shadcn does) for components with variants, and `cn()` from `@/lib/utils` to merge classes.
- **Tokens only:** colours, radii, and fonts come from the CSS variables in `src/styles.css` through Tailwind classes. Add a new token for both `:root` (light) and `.dark` before using a new colour. The palette is provisional (sampled from the musician-view references) until the designer finalises it.

  | Token                        | Tailwind                            | Use                                                |
  | ---------------------------- | ----------------------------------- | -------------------------------------------------- |
  | `background`                 | `bg-background`                     | The tinted chrome behind everything                |
  | `sheet` / `sheet-foreground` | `bg-sheet`, `text-sheet-foreground` | The white reading surface lyrics sit on            |
  | `sidebar`                    | `bg-sidebar`                        | Rails and side panels                              |
  | `primary`                    | `bg-primary`                        | Active toggles and primary buttons (navy)          |
  | `accent`                     | `bg-accent`                         | The selected row in a list                         |
  | `chord`                      | `text-chord`                        | Chords and chord numbers                           |
  | `label`                      | `text-label`                        | Section labels (`VERSE 1`) and small caps metadata |
  | `muted-foreground`           | `text-muted-foreground`             | Secondary text (artist, hints)                     |

- **Fonts:** `font-sans` (UI), `font-mono` (labels, keys, numbers), and `font-lyrics` (lyrics) map to `--typeface-*` variables on system stacks with Traditional Chinese fallbacks. When the designer picks typefaces, change those three variables only.
- **Lyrics size:** `text-lyrics` reads `--lyrics-size`, which `data-lyrics-size="sm|md|lg|xl|2xl"` on the reading sheet sets. The reader picks the size with `useLyricsSize()` (`src/features/reader/lyrics-size.ts`), stored per device.
- **Theme:** `next-themes` sets the `dark` class on `<html>`; use `dark:` variants only when a token can't express the difference. `ThemeToggle` is in the app shell.
- **Icons:** `lucide-react`, sized by the component (shadcn sizes icons inside buttons). Icon-only buttons need an `aria-label` from `t()`.
- **Layout:** the app shell (`AppShell`, `AppSidebar`) owns the sidebar, header, and page padding. Pages render inside `<main>` and set their own max width (`mx-auto max-w-5xl`).
- **Responsive:** design at 390 px first, then add `md:`/`lg:` classes. The shadcn sidebar becomes a sheet on phones automatically.
- **Reader preferences** (lyrics size, Lyrics/Chords, 1-4-5/A-B-C) are per-device choices made with `createStoredChoice` (`src/lib/stored-choice.ts`); add a new one the same way instead of a store or context. Reference: `src/features/reader/`.
- **Reading a song:** `SongReader` (`src/features/reader/song-reader.tsx`) is the one reading sheet for every screen that shows lyrics (musician view, song view, public setlist view): the song header with ⓘ and chord controls, a slim sticky row once the header scrolls away, and lyrics in one column, or two from `xl`. Pages own the toolbar around it (`ReaderPreferenceControls`) and the key state. The musician view (`src/features/setlists/musician-view/`) adds the setlist rail (a sheet on phones), progress strip, and song navigation, and takes `onSongChange` so any route can host it.
- **Toasts:** `toast.success` / `toast.error` from `sonner` for the result of a user action; inline `Alert` for a page that failed to load.
