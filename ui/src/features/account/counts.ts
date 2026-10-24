import type { Session } from '@/features/auth/session';
import type { Folder, SetlistSummary } from '@/features/setlists/api';
import { ownFolders } from '@/features/setlists/permissions';

export type AccountCounts = {
  folders: number;
  setlistsMade: number;
  foldersMade: number;
};

// Folders you belong to, and the setlists and folders you created (what deleting the account removes).
export const accountCounts = (
  session: Session,
  setlists: readonly Pick<SetlistSummary, 'createdBy'>[],
  folders: readonly Folder[]
): AccountCounts => ({
  folders: ownFolders(session, folders).length,
  setlistsMade: setlists.filter(({ createdBy }) => createdBy === session.id).length,
  foldersMade: folders.filter(({ createdBy }) => createdBy === session.id).length,
});
