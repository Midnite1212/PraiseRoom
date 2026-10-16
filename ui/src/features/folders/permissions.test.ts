import { describe, expect, it } from 'vitest';

import type { Session } from '@/features/auth/session';
import type { Folder } from '@/features/setlists/api';

import { membersOf } from './api';
import { canDeleteFolder, canEditFolder } from './permissions';

const session = (groupIds: string[], accessType: Session['accessType'] = 'member'): Session => ({
  id: 'user-1',
  email: 'member@example.com',
  fullName: 'Test Member',
  accessType,
  ownership: {
    _id: '0'.repeat(24),
    userId: 'user-1',
    fullName: 'Test Member',
    accessType,
    groupIds: groupIds.map((id) => ({ id })),
    setlistIds: [],
  },
});

const folder = (createdBy: string | null): Folder => ({
  _id: 'folder-a',
  groupName: 'Team',
  setlistIds: [],
  createdBy,
});

describe('folder permissions', () => {
  it('lets members, the creator, and admins edit', () => {
    expect(canEditFolder(session(['folder-a']), folder('someone'))).toBe(true);
    expect(canEditFolder(session([]), folder('user-1'))).toBe(true);
    expect(canEditFolder(session([], 'admin'), folder('someone'))).toBe(true);
    expect(canEditFolder(session([]), folder('someone'))).toBe(false);
  });

  it('lets the creator or an admin delete, and any member for folders without a creator', () => {
    expect(canDeleteFolder(session(['folder-a']), folder('someone'))).toBe(false);
    expect(canDeleteFolder(session([]), folder('user-1'))).toBe(true);
    expect(canDeleteFolder(session(['folder-a']), folder(null))).toBe(true);
    expect(canDeleteFolder(session([], 'admin'), folder('someone'))).toBe(true);
  });

  it('finds the members of a folder', () => {
    const people = [
      { _id: 'o1', userId: 'u1', fullName: 'Member One', groupIds: [{ id: 'folder-a' }] },
      { _id: 'o2', userId: 'u2', fullName: 'Not A Member', groupIds: [{ id: 'folder-b' }] },
    ];
    expect(membersOf(people, 'folder-a').map(({ userId }) => userId)).toEqual(['u1']);
  });
});
