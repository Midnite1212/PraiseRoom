import { createInternalNeonAuth } from '@neondatabase/auth';

const neonAuth = createInternalNeonAuth(`${window.location.origin}/api/auth`);

export const authClient = neonAuth.adapter;

export const getAuthToken = (): Promise<string | null> => neonAuth.getJWTToken();
