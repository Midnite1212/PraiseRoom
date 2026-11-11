import { describe, expect, it } from 'vitest';

import { type AccessType, canWriteSongs, hasAdminPowers, isSuper, type Session } from './session';

const session = (accessType: AccessType): Session => ({
  id: 'user-1',
  email: 'member@example.com',
  fullName: 'Test Member',
  accessType,
  ownership: {
    _id: '0'.repeat(24),
    userId: 'user-1',
    fullName: 'Test Member',
    accessType,
    groupIds: [],
    setlistIds: [],
  },
});

describe('access type helpers', () => {
  it('gives admins and supers admin powers', () => {
    expect(hasAdminPowers(session('admin'))).toBe(true);
    expect(hasAdminPowers(session('super'))).toBe(true);
    expect(hasAdminPowers(session('editor'))).toBe(false);
    expect(hasAdminPowers(session('member'))).toBe(false);
    expect(hasAdminPowers(null)).toBe(false);
    expect(hasAdminPowers(undefined)).toBe(false);
  });

  it('treats only a super as a super', () => {
    expect(isSuper(session('super'))).toBe(true);
    expect(isSuper(session('admin'))).toBe(false);
    expect(isSuper(null)).toBe(false);
  });

  it('lets editors, admins and supers write songs', () => {
    expect(canWriteSongs(session('editor'))).toBe(true);
    expect(canWriteSongs(session('admin'))).toBe(true);
    expect(canWriteSongs(session('super'))).toBe(true);
    expect(canWriteSongs(session('member'))).toBe(false);
    expect(canWriteSongs(null)).toBe(false);
  });
});
