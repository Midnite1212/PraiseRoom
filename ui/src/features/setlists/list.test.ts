import { describe, expect, it } from 'vitest';

import type { SetlistSummary } from './api';
import { filterSetlists, groupSetlists } from './list';

const setlist = (name: string, date: string | null, createdBy = 'me'): SetlistSummary => ({
  _id: name,
  name,
  date,
  publicLink: null,
  createdBy,
  groupIds: [],
  songs: [],
});

const NOW = new Date(2026, 9, 15, 18, 30);

describe('groupSetlists', () => {
  it('splits upcoming (from today), past, and undated, each in a useful order', () => {
    const groups = groupSetlists(
      [
        setlist('Next month', new Date(2026, 10, 1).toISOString()),
        setlist('Today', new Date(2026, 9, 15).toISOString()),
        setlist('Last week', new Date(2026, 9, 8).toISOString()),
        setlist('Last year', new Date(2025, 9, 15).toISOString()),
        setlist('Zeta', null),
        setlist('Alpha', 'not a date'),
      ],
      NOW
    );
    expect(groups.upcoming.map(({ name }) => name)).toEqual(['Today', 'Next month']);
    expect(groups.past.map(({ name }) => name)).toEqual(['Last week', 'Last year']);
    expect(groups.undated.map(({ name }) => name)).toEqual(['Alpha', 'Zeta']);
  });
});

describe('filterSetlists', () => {
  const all = [setlist('Sunday Service', null), setlist('Youth Night', null, 'someone-else')];

  it('matches names case-insensitively', () => {
    expect(filterSetlists(all, { search: 'sunday', ownership: 'all', userId: 'me' })).toHaveLength(
      1
    );
  });

  it('separates my setlists from shared ones', () => {
    expect(
      filterSetlists(all, { search: '', ownership: 'mine', userId: 'me' }).map(({ name }) => name)
    ).toEqual(['Sunday Service']);
    expect(
      filterSetlists(all, { search: '', ownership: 'shared', userId: 'me' }).map(({ name }) => name)
    ).toEqual(['Youth Night']);
  });
});
