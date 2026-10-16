# Data fetching

Reference: `src/features/songs/api.ts`, `src/routes/_app/songs/index.tsx`.

- **One `api.ts` per feature** holds the Zod schemas for its responses and the `queryOptions` factories. Components and loaders import those factories; they never build query keys inline.
- **Every request goes through `apiRequest(path, schema, options)`**, which adds the bearer token, encodes `query`, sends JSON, throws `ApiError(status)` on failure, and parses the response with the schema. Model only the fields the UI uses; Zod strips the rest.
- **Query keys** start with the feature and resource and end with the params object: `['songs', 'search', { keyword, page }]`.
- **Loaders prefetch, components read:** a route's `loader` calls `context.queryClient.ensureQueryData(options)`, and the component calls `useQuery(options)` (add `placeholderData: keepPreviousData` for paging so the old page stays visible).
- **Mutations** use `useMutation` with `apiRequest(..., { method: 'PUT', body })`, then `queryClient.invalidateQueries({ queryKey: [feature] })` on success, plus a toast for success and failure.
- **Errors:** client errors (4xx) are not retried (see `src/lib/query-client.ts`). Show a translated message; never render `error.message`.
- **Session:** use `Route.useRouteContext().session` inside `/_app` routes; outside them, `useQuery(sessionQueryOptions)`.
