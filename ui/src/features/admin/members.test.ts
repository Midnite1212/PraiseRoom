import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api-client';

import type { Member } from './api';
import { countSupers, filterMembers, isAssignableAccessType, roleChangeErrorKey } from './members';

const members: Member[] = [
  { userId: 'u1', fullName: 'Alpha Tester', accessType: 'super' },
  { userId: 'u2', fullName: 'Beta Tester', accessType: 'admin' },
  { userId: 'u3', fullName: 'Gamma Person', accessType: 'member' },
  { userId: 'u4', fullName: 'Delta Person', accessType: 'super' },
];

describe('member roles', () => {
  it('assigns member, editor and admin but never super', () => {
    expect(['member', 'editor', 'admin'].every(isAssignableAccessType)).toBe(true);
    expect(isAssignableAccessType('super')).toBe(false);
    expect(isAssignableAccessType('Admin')).toBe(false);
  });

  it('counts supers', () => {
    expect(countSupers(members)).toBe(2);
    expect(countSupers([])).toBe(0);
  });

  it('filters by name, ignoring case and surrounding spaces', () => {
    expect(filterMembers(members, '  tester ').map(({ userId }) => userId)).toEqual(['u1', 'u2']);
    expect(filterMembers(members, '')).toHaveLength(4);
    expect(filterMembers(members, 'nobody')).toEqual([]);
  });

  it('maps a failed role change to a translated message', () => {
    expect(roleChangeErrorKey(new ApiError(403))).toBe('admin.members.forbidden');
    expect(roleChangeErrorKey(new ApiError(404))).toBe('admin.members.notFound');
    expect(roleChangeErrorKey(new ApiError(500))).toBe('admin.members.failed');
    expect(roleChangeErrorKey(new Error('offline'))).toBe('admin.members.failed');
  });
});
