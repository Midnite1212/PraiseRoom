import { useQuery } from '@tanstack/react-query';

import type { Session } from '@/features/auth/session';
import { peopleQueryOptions } from '@/features/folders/api';

import { foldersQueryOptions } from './api';
import { ownFolders } from './permissions';
import type { SetlistNames } from './setlist-row';

// The names setlist rows show: your folders, and the people who made setlists shared with you.
export const useSetlistNames = (session: Session): SetlistNames => {
  const { data: folders } = useQuery(foldersQueryOptions());
  const { data: people } = useQuery(peopleQueryOptions());
  return {
    folders: new Map(
      ownFolders(session, folders ?? []).map(({ _id, groupName }) => [_id, groupName])
    ),
    people: new Map((people ?? []).map(({ userId, fullName }) => [userId, fullName])),
  };
};
