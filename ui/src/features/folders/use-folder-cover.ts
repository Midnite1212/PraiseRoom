import { useQuery } from '@tanstack/react-query';

import { type Folder, setlistsQueryOptions } from '@/features/setlists/api';

import { type FolderCover, folderCover, nextFolderDate } from './folder-cover';

// The folder's cover and next setlist date, drawn from the setlists list the other pages share.
export const useFolderCover = (
  folder: Folder,
  now: number
): { cover: FolderCover; nextDate: string | null } => {
  const { data: setlists } = useQuery(setlistsQueryOptions());
  const inFolder = new Set(folder.setlistIds);
  const own = (setlists ?? []).filter(({ _id }) => inFolder.has(_id));
  return { cover: folderCover(folder._id), nextDate: nextFolderDate(own, now) };
};
