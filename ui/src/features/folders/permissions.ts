import type { Session } from '@/features/auth/session';
import type { Folder } from '@/features/setlists/api';

const isMember = (session: Session, folder: Folder): boolean =>
  session.ownership.groupIds.some(({ id }) => id === folder._id);

// Mirrors `canEditGroup` and `canDeleteGroup` in `server/src/utils/authorization.ts`.
export const canEditFolder = (session: Session, folder: Folder): boolean =>
  session.accessType === 'admin' || folder.createdBy === session.id || isMember(session, folder);

export const canDeleteFolder = (session: Session, folder: Folder): boolean => {
  if (session.accessType === 'admin') return true;
  return folder.createdBy ? folder.createdBy === session.id : isMember(session, folder);
};
