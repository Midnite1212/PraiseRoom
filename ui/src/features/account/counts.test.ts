import { describe, expect, it } from 'vitest';

import type { Session } from '@/features/auth/session';

import { accountCounts } from './counts';

const session: Session = {
  id: 'user-1',
  email: 'dummy@example.com',
  fullName: 'Test Member',
  accessType: 'member',
  ownership: {
    _id: 'o1',
    userId: 'user-1',
    fullName: 'Test Member',
    accessType: 'member',
    groupIds: [{ id: 'f1' }, { id: 'f2' }],
    setlistIds: [],
  },
};

const folder = (id: string, createdBy: string) => ({
  _id: id,
  groupName: id,
  setlistIds: [],
  createdBy,
});

describe('accountCounts', () => {
  it('counts the folders you belong to and the setlists and folders you made', () => {
    expect(
      accountCounts(
        session,
        [{ createdBy: 'user-1' }, { createdBy: 'user-2' }, { createdBy: 'user-1' }, {}],
        [folder('f1', 'user-1'), folder('f2', 'user-2'), folder('f3', 'user-1')]
      )
    ).toEqual({ folders: 2, setlistsMade: 2, foldersMade: 2 });
  });

  it('is all zero for an empty library', () => {
    expect(accountCounts(session, [], [])).toEqual({ folders: 0, setlistsMade: 0, foldersMade: 0 });
  });
});
