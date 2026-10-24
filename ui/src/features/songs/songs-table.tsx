import { useNavigate } from '@tanstack/react-router';
import { createColumnHelper, FlexRender, tableFeatures, useTable } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ChevronDown, ChevronUp } from 'pixelarticons/react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { KeyChip } from '@/components/primitives/key-chip';
import { TempoMeter } from '@/components/primitives/tempo-meter';
import { cn } from '@/lib/utils';

import { type SongSort, songSlug, type SongSummary, type SortDirection } from './api';

const features = tableFeatures({});

const columnHelper = createColumnHelper<typeof features, SongSummary>();

type ColumnMeta = { headClassName?: string; cellClassName?: string };

const createColumns = (t: TFunction) =>
  columnHelper.columns([
    columnHelper.accessor('title', {
      header: () => t('songs.columns.title'),
      cell: ({ getValue, row }) => (
        <>
          <b className="text-ink text-ui block font-semibold">{getValue()}</b>
          <small className="text-ink-3 mt-0.5 block text-[0.8125rem]">{row.original.artist}</small>
        </>
      ),
    }),
    columnHelper.accessor('originalKey', {
      header: () => t('songs.columns.key'),
      cell: ({ getValue }) => <KeyChip musicKey={getValue()} />,
    }),
    columnHelper.accessor('tempo', {
      header: () => t('songs.columns.tempo'),
      cell: ({ getValue }) => <TempoMeter tempo={getValue()} />,
    }),
    columnHelper.accessor('code', {
      header: () => t('songs.columns.code'),
      cell: ({ getValue }) => getValue() ?? '',
      meta: { headClassName: 'text-right', cellClassName: 'text-right font-mono' },
    }),
  ]);

const SORT_BY_COLUMN: Readonly<Record<string, SongSort>> = {
  title: 'title',
  originalKey: 'key',
  tempo: 'tempo',
  code: 'code',
};

const columnMeta = (meta: unknown): ColumnMeta =>
  typeof meta === 'object' && meta !== null ? meta : {};

const isEditable = (target: EventTarget) =>
  target instanceof Element &&
  target.closest('input, textarea, select, [contenteditable]') !== null;

// Wide screens: the library as a table. A click selects a row (the page shows it in the preview pane),
// double-click, Enter or Space opens it, and the arrows move the selection.
export function SongsTable({
  songs,
  selectedId,
  sort,
  dir,
  onSort,
  onSelect,
  onClearSearch,
  onClearFilters,
}: {
  songs: SongSummary[];
  selectedId?: string;
  sort: SongSort;
  dir: SortDirection;
  onSort: (sort: SongSort) => void;
  onSelect: (songId: string) => void;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const table = useTable({
    features,
    data: songs,
    columns: createColumns(t),
    getRowId: (song) => song._id,
  });

  if (songs.length === 0)
    return (
      <EmptyState
        title={t('songs.empty')}
        onClearSearch={onClearSearch}
        onClearFilters={onClearFilters}
      >
        {t('songs.emptyHint')}
      </EmptyState>
    );

  const open = (songId: string) => {
    const song = songs.find(({ _id }) => _id === songId);
    if (song) void navigate({ to: '/songs/$songSlug', params: { songSlug: songSlug(song) } });
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, songId: string) => {
    if (event.target !== event.currentTarget || isEditable(event.target)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open(songId);
      return;
    }
    const sibling =
      event.key === 'ArrowDown'
        ? event.currentTarget.nextElementSibling
        : event.key === 'ArrowUp'
          ? event.currentTarget.previousElementSibling
          : null;
    if (!(sibling instanceof HTMLElement) || !sibling.dataset.songId) return;
    event.preventDefault();
    onSelect(sibling.dataset.songId);
    sibling.focus();
  };

  return (
    <table className="w-full border-separate border-spacing-y-0.5">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const columnSort = SORT_BY_COLUMN[header.column.id];
              const isSorted = columnSort === sort;
              const SortIcon = dir === 'asc' ? ChevronDown : ChevronUp;
              return (
                <th
                  key={header.id}
                  aria-sort={isSorted ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'bg-ground/92 sticky top-20 z-[5] h-9 p-0 text-left text-xs font-semibold',
                    columnMeta(header.column.columnDef.meta).headClassName
                  )}
                >
                  {header.isPlaceholder ? null : columnSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(columnSort)}
                      className={cn(
                        'hover:liquid-hover hover:text-ink inline-flex h-9 items-center gap-1 rounded-[10px] px-2.5 text-xs font-semibold transition-colors duration-150',
                        isSorted ? 'text-ink' : 'text-ink-3'
                      )}
                    >
                      <FlexRender header={header} />
                      {isSorted ? <SortIcon aria-hidden className="size-3.5" /> : null}
                    </button>
                  ) : (
                    <FlexRender header={header} />
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => {
          const selected = row.id === selectedId;
          return (
            <tr
              key={row.id}
              id={`song-row-${row.id}`}
              data-song-id={row.id}
              tabIndex={0}
              aria-selected={selected}
              onClick={() => onSelect(row.id)}
              onDoubleClick={() => open(row.id)}
              onKeyDown={(event) => onRowKeyDown(event, row.id)}
              className="group/row hover:liquid-hover aria-selected:liquid-on focus-visible:liquid-hover cursor-pointer transition-colors duration-150 outline-none [clip-path:inset(0_round_16px)]"
            >
              {row.getAllCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    'text-ink-2 h-[58px] px-3 align-middle text-sm group-focus-visible/row:first:shadow-[inset_2px_0_0_var(--chord)]',
                    columnMeta(cell.column.columnDef.meta).cellClassName
                  )}
                >
                  <FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
