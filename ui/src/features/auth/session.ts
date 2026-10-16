import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiError, apiRequest, clearAuthToken } from '@/lib/api-client';
import { authClient, fetchSession, type SessionUser } from '@/lib/auth-client';

export const ACCESS_TYPES = ['member', 'editor', 'admin'] as const;

export type AccessType = (typeof ACCESS_TYPES)[number];

const ownershipEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  createdAt: z.string().optional(),
});

export const ownershipSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  accessType: z.string(),
  groupIds: z.array(ownershipEntrySchema),
  setlistIds: z.array(ownershipEntrySchema),
});

export type Ownership = z.infer<typeof ownershipSchema>;

export type Session = {
  id: string;
  email: string;
  fullName: string;
  accessType: AccessType;
  ownership: Ownership;
};

const toAccessType = (value: string): AccessType =>
  ACCESS_TYPES.find((accessType) => accessType === value) ?? 'member';

export const canWriteSongs = (session: Session | null): boolean =>
  session?.accessType === 'editor' || session?.accessType === 'admin';

const loadOwnership = async (user: SessionUser): Promise<Ownership> => {
  try {
    return await apiRequest('/api/ownerships/get', ownershipSchema, {
      query: { userId: user.id },
    });
  } catch (error: unknown) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    return apiRequest('/api/ownerships/create', ownershipSchema, {
      method: 'POST',
      body: { fullName: user.name },
    });
  }
};

const loadSession = async (): Promise<Session | null> => {
  const { user } = await fetchSession();
  if (!user) {
    return null;
  }
  const ownership = await loadOwnership(user);
  return {
    id: user.id,
    email: user.email,
    fullName: user.name,
    accessType: toAccessType(ownership.accessType),
    ownership,
  };
};

export const sessionQueryOptions = queryOptions({
  queryKey: ['session'],
  queryFn: loadSession,
  staleTime: 5 * 60_000,
});

export const signOut = async (): Promise<void> => {
  await authClient.signOut();
  clearAuthToken();
};
