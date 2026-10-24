import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { folderSchema } from '@/features/setlists/api';
import { apiRequest } from '@/lib/api-client';

const personSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  groupIds: z.array(z.object({ id: z.string().optional() })),
});

export type Person = z.infer<typeof personSchema>;

export const folderQueryOptions = (folderId: string) =>
  queryOptions({
    queryKey: ['folders', 'detail', folderId],
    queryFn: ({ signal }) =>
      apiRequest('/api/groups/get', folderSchema, { query: { id: folderId }, signal }),
  });

// Everyone with an ownership record; members of a folder are the people whose `groupIds` list it.
export const peopleQueryOptions = () =>
  queryOptions({
    queryKey: ['people'],
    queryFn: ({ signal }) => apiRequest('/api/ownerships/get', z.array(personSchema), { signal }),
    staleTime: 60_000,
  });

export const membersOf = (people: readonly Person[], folderId: string): Person[] =>
  people.filter((person) => person.groupIds.some(({ id }) => id === folderId));

const savedFolderSchema = z.object({ _id: z.string() });

export const createFolder = (groupName: string) =>
  apiRequest('/api/groups/create', savedFolderSchema, { method: 'POST', body: { groupName } });

export const renameFolder = (folderId: string, groupName: string) =>
  apiRequest('/api/groups/update', savedFolderSchema, {
    method: 'PUT',
    body: { id: folderId, groupName },
  });

export const setFolderSetlists = (folderId: string, setlistIds: string[]) =>
  apiRequest('/api/groups/update', savedFolderSchema, {
    method: 'PUT',
    body: { id: folderId, setlistIds },
  });

export const deleteFolder = (folderId: string) =>
  apiRequest('/api/groups/delete', z.unknown(), { method: 'PUT', body: { id: folderId } });

export const changeFolderMembers = (
  folderId: string,
  change: { add?: string[]; remove?: string[] }
) =>
  apiRequest('/api/groups/members', z.unknown(), {
    method: 'PUT',
    body: { groupId: folderId, add: change.add ?? [], remove: change.remove ?? [] },
  });

const inviteSchema = z.object({ token: z.string() });

// Get-or-create: the server returns the folder's existing token or makes one, so it is safe to refetch.
export const inviteQueryOptions = (folderId: string) =>
  queryOptions({
    queryKey: ['invites', folderId],
    queryFn: ({ signal }) =>
      apiRequest('/api/groups/invite', inviteSchema, {
        method: 'PUT',
        body: { groupId: folderId },
        signal,
      }),
    staleTime: Infinity,
  });

export const inviteUrl = (token: string, origin = window.location.origin): string =>
  `${origin}/join/${encodeURIComponent(token)}`;

export const joinFolder = (token: string) =>
  apiRequest('/api/groups/join', z.object({ groupId: z.string() }), {
    method: 'PUT',
    body: { token },
  });

// Folder writes change who can see which setlists, and the caller's own membership lives in the session.
export const FOLDER_RELATED_QUERY_KEYS = [
  ['folders'],
  ['people'],
  ['setlists'],
  ['session'],
] as const;
