import { describe, expect, it } from 'vitest';

import type { SetlistSummary } from '@/features/setlists/api';

import { nextSetSongIds } from './next-set';

const setlist = (id: string, date: string | null, songIds: string[]): SetlistSummary => ({
  _id: id,
  name: id,
  date,
  groupIds: [],
  songs: songIds.map((songId) => ({ _id: songId })),
});

const NOW = new Date('2026-06-10T12:00:00').getTime();

describe('nextSetSongIds', () => {
  it('returns the songs of the soonest set dated today or later', () => {
    const ids = nextSetSongIds(
      [
        setlist('past', '2026-06-01T00:00:00', ['a']),
        setlist('later', '2026-06-30T00:00:00', ['c']),
        setlist('soon', '2026-06-14T00:00:00', ['b', 'd']),
      ],
      NOW
    );
    expect([...ids].toSorted()).toEqual(['b', 'd']);
  });

  it('is empty when no set is coming up', () => {
    expect(nextSetSongIds([setlist('past', '2026-06-01T00:00:00', ['a'])], NOW).size).toBe(0);
  });
});
