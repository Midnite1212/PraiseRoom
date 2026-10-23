import { useQuery } from '@tanstack/react-query';

import { nextSetlistId } from '@/components/primitives/set-status';
import { type Folder, setlistsQueryOptions } from '@/features/setlists/api';

import { type Cell, coverCells, nextFolderDate } from './folder-cover';

// The folder's cover pixels and next setlist date, drawn from the setlists list the other pages share.
export const useFolderCover = (
  folder: Folder,
  now: number
): { cells: Cell[]; nextDate: string | null } => {
  const { data: setlists } = useQuery(setlistsQueryOptions());
  const all = setlists ?? [];
  const inFolder = new Set(folder.setlistIds);
  const own = all.filter(({ _id }) => inFolder.has(_id));
  return {
    cells: coverCells(own, nextSetlistId(all, now), now),
    nextDate: nextFolderDate(own, now),
  };
};
