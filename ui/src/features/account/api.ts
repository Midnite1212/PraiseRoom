import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { ownershipSchema } from '@/features/auth/session';
import { apiRequest } from '@/lib/api-client';
import { authClient, fetchSession } from '@/lib/auth-client';

export const ACCOUNT_QUERY_KEY = ['account'] as const;

export const accountSessionsQueryOptions = queryOptions({
  queryKey: [...ACCOUNT_QUERY_KEY, 'sessions'],
  queryFn: async () => {
    const [sessions, current] = await Promise.all([authClient.listSessions(), fetchSession()]);
    return { sessions, currentToken: current.sessionToken };
  },
});

export const accountLoginsQueryOptions = queryOptions({
  queryKey: [...ACCOUNT_QUERY_KEY, 'logins'],
  queryFn: () => authClient.listAccounts(),
});

// The name lives in Neon Auth and, for the folders you share, on your ownership record; both change together.
export const renameAccount = async (ownershipId: string, name: string): Promise<void> => {
  await authClient.updateName(name);
  await apiRequest('/api/ownerships/update', ownershipSchema, {
    method: 'PUT',
    body: { _id: ownershipId, fullName: name },
  });
};

const deletedDataSchema = z.object({ folders: z.number(), setlists: z.number() });

// The data goes first; Neon Auth then deletes the sign-in itself.
export const deleteAccount = async (): Promise<void> => {
  await apiRequest('/api/ownerships/delete-account', deletedDataSchema, { method: 'PUT' });
  await authClient.deleteUser();
};
