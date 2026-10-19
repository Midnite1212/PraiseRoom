# Forms

Reference: `src/routes/login.tsx` (validated form), `src/features/songs/song-search-form.tsx` (small form bound to the URL).

- **TanStack Form + Zod 4.** Pass the Zod schema straight to `validators: { onSubmit: schema }` (or `onChange` / `onBlur` when live feedback helps); no adapter is needed.
- **Translated messages:** build the schema inside the component with messages from `t()`, such as `z.email(t('validation.emailInvalid'))`, so errors follow the current language.
- **Fields:** render each `form.Field` with shadcn's `Field`, `FieldLabel`, `Input`, and `FieldError`. Compute `isInvalid = field.state.meta.isTouched && !field.state.meta.isValid`, then set `data-invalid` on `Field` and `aria-invalid` on the input, and show `FieldError` only when invalid.
- **Submit:** `onSubmit` on the `<form>` calls `event.preventDefault()` and `void form.handleSubmit()`. Disable the submit button with `form.Subscribe` on `state.isSubmitting`.
- **Server errors:** catch them in `onSubmit`, map the status or code to a translation key, and show it in an `Alert` above the form. Never show server text.
- **Lists inside a form** (songs in a setlist, folder ids) are one field holding the whole array; child components get `value` and `onChange` and return a new array (`moveItem`, `filter`, `map`), never mutate. Reference: `src/features/setlists/editor/`.
- **Unsaved changes:** forms that edit a record block navigation while dirty with `useBlocker` and a translated confirm, and `formApi.reset(value)` after a successful save so the redirect isn't blocked. A form inside a dialog (not a route) has no navigation to block: read dirtiness with `useStore(form.store, (state) => state.isDirty)`, report it to the dialog's owner through a prop (`onDirtyChange`), and confirm discarding with `AlertDialog` instead. Reference: `src/features/song-import/import-form.tsx` and `src/features/song-import/import-dialog.tsx`.
- **Save and delete** go through `useMutation`, then invalidate the feature's queries, toast, and navigate. Deletes ask first with `AlertDialog`.
- **Forms that mirror the URL** (search, filters) take the current value as `defaultValues` and get a `key` from that value, so going back in history resets them.
