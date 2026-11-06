import { ApiError } from '@/lib/api-client';

import { ASSIGNABLE_ACCESS_TYPES, type AssignableAccessType, type Member } from './api';

export const isAssignableAccessType = (value: string): value is AssignableAccessType =>
  ASSIGNABLE_ACCESS_TYPES.some((accessType) => accessType === value);

export const countSupers = (members: readonly Member[]): number =>
  members.filter(({ accessType }) => accessType === 'super').length;

export const filterMembers = (members: readonly Member[], query: string): Member[] => {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === '') return [...members];
  return members.filter(({ fullName }) => fullName.toLocaleLowerCase().includes(needle));
};

export const roleChangeErrorKey = (error: unknown) => {
  if (error instanceof ApiError && error.status === 403) return 'admin.members.forbidden';
  if (error instanceof ApiError && error.status === 404) return 'admin.members.notFound';
  return 'admin.members.failed';
};
