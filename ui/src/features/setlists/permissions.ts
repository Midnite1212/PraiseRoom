import type { Session } from '@/features/auth/session';

type SetlistAccess = { _id: string; createdBy?: string | null; groupIds: readonly string[] };

const entryIds = (entries: readonly { id?: string }[]): Set<string> =>
  new Set(entries.flatMap(({ id }) => (id ? [id] : [])));

const memberFolderIds = (session: Session): Set<string> => entryIds(session.ownership.groupIds);

// Mirrors the server's rules in `server/src/utils/authorization.ts`; the server still decides.
export const canEditSetlist = (
  session: Session | null | undefined,
  setlist: SetlistAccess
): boolean => {
  if (!session) return false;
  if (session.accessType === 'admin' || setlist.createdBy === session.id) return true;
  if (entryIds(session.ownership.setlistIds).has(setlist._id)) return true;
  const folders = memberFolderIds(session);
  return setlist.groupIds.some((groupId) => folders.has(groupId));
};

export const canDeleteSetlist = (
  session: Session | null | undefined,
  setlist: SetlistAccess
): boolean =>
  Boolean(session && (session.accessType === 'admin' || setlist.createdBy === session.id));

export const ownFolders = <T extends { _id: string }>(
  session: Session,
  folders: readonly T[]
): T[] => {
  const ids = memberFolderIds(session);
  return folders.filter((folder) => ids.has(folder._id));
};
