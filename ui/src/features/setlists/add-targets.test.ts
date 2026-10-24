import { describe, expect, it } from 'vitest';

import type { Session } from '@/features/auth/session';

import { addTargets } from './add-targets';
import type { SetlistSummary } from './api';

const session: Session = {
  id: 'user-1',
  email: 'member@example.com',
  fullName: 'Test Member',
  accessType: 'member',
  ownership: {
    _id: '0'.repeat(24),
    userId: 'user-1',
    fullName: 'Test Member',
    accessType: 'member',
    groupIds: [],
    setlistIds: [],
  },
};

const setlist = (overrides: Partial<SetlistSummary> & { _id: string }): SetlistSummary => ({
  urlKey: 'k3x9p2',
  name: overrides._id,
  date: null,
  createdBy: 'user-1',
  groupIds: [],
  songs: [],
  ...overrides,
});

const now = new Date(2026, 9, 24, 12);

describe('addTargets', () => {
  it('lists upcoming setlists soonest first, then undated, and drops past and uneditable ones', () => {
    const targets = addTargets(
      [
        setlist({ _id: 'past', date: new Date(2026, 9, 1).toISOString() }),
        setlist({ _id: 'undated' }),
        setlist({ _id: 'later', date: new Date(2026, 10, 8).toISOString() }),
        setlist({ _id: 'today', date: new Date(2026, 9, 24).toISOString() }),
        setlist({ _id: 'theirs', createdBy: 'someone-else' }),
      ],
      session,
      'song-1',
      now
    );
    expect(targets.map(({ setlist: { _id } }) => _id)).toEqual(['today', 'later', 'undated']);
  });

  it('marks a setlist that already has the song', () => {
    const targets = addTargets(
      [
        setlist({ _id: 'has', songs: [{ _id: 'song-1', title: 'Test Song' }] }),
        setlist({ _id: 'lacks', songs: [{ _id: 'song-2', title: 'Other Song' }] }),
      ],
      session,
      'song-1',
      now
    );
    expect(targets.map(({ setlist: { _id }, hasSong }) => [_id, hasSong])).toEqual([
      ['has', true],
      ['lacks', false],
    ]);
  });
});
