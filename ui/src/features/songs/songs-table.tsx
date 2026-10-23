import { Link, useNavigate } from '@tanstack/react-router';
import { createColumnHelper, FlexRender, tableFeatures, useTable } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { Tag } from '@/components/primitives/tag';
import { cn } from '@/lib/utils';

import type { SongSummary } from './api';

const features = tableFeatures({});

const columnHelper = createColumnHelper<typeof features, SongSummary>();

const createColumns = (t: TFunction) =>
  columnHelper.columns([
    columnHelper.accessor('title', {
      header: () => t('songs.columns.title'),
      cell: ({ getValue, row }) => (
        <Link
          to="/songs/$songId"
          params={{ songId: row.original._id }}
          className="text-ink block text-[0.9375rem] font-semibold outline-none"
        >
          {getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor('artist', { header: () => t('songs.columns.artist') }),
    columnHelper.accessor('originalKey', {
      header: () => t('songs.columns.key'),
      meta: { className: 'text-ink font-mono text-[0.9375rem] font-bold' },
    }),
    columnHelper.accessor('tempo', {
      header: () => t('songs.columns.tempo'),
      cell: ({ getValue }) => getValue().join(', '),
    }),
    columnHelper.accessor('themes', {
      header: () => t('songs.columns.themes'),
      cell: ({ getValue }) => (
        <span className="flex flex-wrap gap-1">
          {getValue().map((theme) => (
            <Tag key={theme}>{theme}</Tag>
          ))}
        </span>
      ),
    }),
    columnHelper.accessor('code', {
      header: () => t('songs.columns.code'),
      cell: ({ getValue }) => getValue() ?? '—',
      meta: { className: 'font-mono' },
    }),
  ]);

const cellClassName = (meta: unknown): string | undefined =>
  typeof meta === 'object' &&
  meta !== null &&
  'className' in meta &&
  typeof meta.className === 'string'
    ? meta.className
    : undefined;

// Wide screens: the library as a table; a whole row opens its song.
export function SongsTable({ songs }: { songs: SongSummary[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const table = useTable({
    features,
    data: songs,
    columns: createColumns(t),
    getRowId: (song) => song._id,
  });

  if (songs.length === 0)
    return <EmptyState title={t('songs.empty')}>{t('songs.emptyHint')}</EmptyState>;

  return (
    <table className="w-full border-separate border-spacing-y-0.5">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="text-ink-3 bg-ground/92 sticky top-20 z-[5] h-9 px-3 text-left text-xs font-semibold"
              >
                {header.isPlaceholder ? null : <FlexRender header={header} />}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            onClick={(event) => {
              if (event.target instanceof Element && event.target.closest('a')) return;
              void navigate({ to: '/songs/$songId', params: { songId: row.original._id } });
            }}
            className="group/row cursor-pointer"
          >
            {row.getAllCells().map((cell) => (
              <td
                key={cell.id}
                className={cn(
                  'text-ink-2 group-hover/row:bg-fill-hover group-has-[a:focus-visible]/row:bg-fill-hover h-[58px] px-3 align-middle text-sm transition-colors duration-150 first:rounded-l-2xl last:rounded-r-2xl group-has-[a:focus-visible]/row:first:shadow-[inset_2px_0_0_var(--chord)]',
                  cellClassName(cell.column.columnDef.meta)
                )}
              >
                <FlexRender cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
