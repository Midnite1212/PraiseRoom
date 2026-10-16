import { Link } from '@tanstack/react-router';
import { createColumnHelper, FlexRender, tableFeatures, useTable } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { SongSummary } from './api';

const features = tableFeatures({});

const columnHelper = createColumnHelper<typeof features, SongSummary>();

const createColumns = (t: TFunction) =>
  columnHelper.columns([
    columnHelper.accessor('code', {
      header: () => t('songs.columns.code'),
      cell: ({ getValue }) => getValue() ?? '—',
    }),
    columnHelper.accessor('title', {
      header: () => t('songs.columns.title'),
      cell: ({ getValue, row }) => (
        <Link
          to="/songs/$songId"
          params={{ songId: row.original._id }}
          className="font-medium underline-offset-4 hover:underline"
        >
          {getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor('artist', { header: () => t('songs.columns.artist') }),
    columnHelper.accessor('originalKey', { header: () => t('songs.columns.key') }),
    columnHelper.accessor('tempo', {
      header: () => t('songs.columns.tempo'),
      cell: ({ getValue }) => getValue().join(', '),
    }),
  ]);

export function SongsTable({ songs }: { songs: SongSummary[] }) {
  const { t } = useTranslation();
  const table = useTable({
    features,
    data: songs,
    columns: createColumns(t),
    getRowId: (song) => song._id,
  });

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : <FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center">
                {t('songs.empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
