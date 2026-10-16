import { describe, expect, it } from 'vitest';

import type { Session } from '@/features/auth/session';

import { canDeleteSetlist, canEditSetlist, ownFolders } from './permissions';

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 'user-1',
  email: 'member@example.com',
  fullName: 'Test Member',
  accessType: 'member',
  ownership: {
    _id: '0'.repeat(24),
    userId: 'user-1',
    fullName: 'Test Member',
    accessType: 'member',
    groupIds: [{ id: 'folder-a' }],
    setlistIds: [{ id: 'legacy-setlist' }],
  },
  ...overrides,
});

describe('setlist permissions', () => {
  it('lets the creator, an admin, folder members, and legacy owners edit', () => {
    expect(canEditSetlist(session(), { _id: 's1', createdBy: 'user-1', groupIds: [] })).toBe(true);
    expect(
      canEditSetlist(session({ accessType: 'admin' }), { _id: 's1', createdBy: 'x', groupIds: [] })
    ).toBe(true);
    expect(canEditSetlist(session(), { _id: 's1', createdBy: 'x', groupIds: ['folder-a'] })).toBe(
      true
    );
    expect(canEditSetlist(session(), { _id: 'legacy-setlist', createdBy: 'x', groupIds: [] })).toBe(
      true
    );
    expect(canEditSetlist(session(), { _id: 's1', createdBy: 'x', groupIds: ['folder-b'] })).toBe(
      false
    );
    expect(canEditSetlist(null, { _id: 's1', createdBy: 'user-1', groupIds: [] })).toBe(false);
  });

  it('lets only the creator or an admin delete', () => {
    expect(canDeleteSetlist(session(), { _id: 's1', createdBy: 'user-1', groupIds: [] })).toBe(
      true
    );
    expect(canDeleteSetlist(session(), { _id: 's1', createdBy: 'x', groupIds: ['folder-a'] })).toBe(
      false
    );
    expect(
      canDeleteSetlist(session({ accessType: 'admin' }), {
        _id: 's1',
        createdBy: 'x',
        groupIds: [],
      })
    ).toBe(true);
  });

  it('keeps only folders the caller belongs to', () => {
    expect(ownFolders(session(), [{ _id: 'folder-a' }, { _id: 'folder-b' }])).toEqual([
      { _id: 'folder-a' },
    ]);
  });
});
