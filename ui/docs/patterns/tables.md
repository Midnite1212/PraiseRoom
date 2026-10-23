# Tables

Reference: `src/features/songs/songs-table.tsx`.

- **TanStack Table v9 + shadcn `Table`.** Declare the features a table uses with `tableFeatures({...})` (empty for a plain table; add `rowSortingFeature`, `rowPaginationFeature`, and so on as needed), then build columns with `createColumnHelper<typeof features, Row>()`.
- **Render** with `table.getHeaderGroups()` and `table.getRowModel().rows`, using `<FlexRender header={header} />` and `<FlexRender cell={cell} />`.
- **Row ids:** `getRowId: (row) => row._id`, never the index.
- **Headers** are functions that call `t()`, so they follow the current language.
- **Server-side paging and search:** the API returns one page; keep `page` and the keyword in the route's search params and page with buttons (see the songs route). Use client-side features only on data that is fully loaded.
- **Empty state:** one full-width row with a translated message.
- **Phones:** wrap the table in a bordered `overflow-hidden` container and keep columns few; for wide data, render a card list below `md` instead of a cramped table.
- **Grouped phone lists:** `groupSongs(songs, sort)` (`src/features/songs/song-groups.ts`) splits an already sorted page into headed runs; a new sort adds one entry to its `GROUP_LABELS`. Headings and the A–Z `LetterScrubber` only cover the page that is loaded, since paging stays server-side.
- **Select-to-preview tables (wide):** a row click selects it (`aria-selected`, `bg-fill-on`) and the page shows it in a sticky pane beside the table (`SongPreview`); double-click, Enter or Space opens it, and ↑/↓ on a focused row move the selection and focus. The selection is a `song` search param kept out of `loaderDeps`, and the page clears it when the song is no longer in the loaded page. Esc closes the pane through a window listener that skips inputs and dialogs. The pane fetches what the list does not carry (the lyrics peek) with its own query.
