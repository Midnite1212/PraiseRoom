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
    expect(groups.next).toBeNull();
  });

  it('splits the soonest upcoming setlist out when leading with it', () => {
    const groups = groupSetlists(
      [
        setlist('Next month', new Date(2026, 10, 1).toISOString()),
        setlist('Today', new Date(2026, 9, 15).toISOString()),
      ],
      NOW,
      { leadWithNext: true }
    );
    expect(groups.next?.name).toBe('Today');
    expect(groups.upcoming.map(({ name }) => name)).toEqual(['Next month']);
  });

  it('has no next setlist when nothing is upcoming', () => {
    const groups = groupSetlists([setlist('Last week', new Date(2026, 9, 8).toISOString())], NOW, {
      leadWithNext: true,
    });
    expect(groups.next).toBeNull();
    expect(groups.past).toHaveLength(1);
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

  it('keeps setlists in any chosen folder', () => {
    const inFolders = [
      { ...setlist('Care group', null), groupIds: ['care'] },
      { ...setlist('Youth', null), groupIds: ['youth'] },
      setlist('Loose', null),
    ];
    expect(
      filterSetlists(inFolders, {
        search: '',
        ownership: 'all',
        userId: 'me',
        folderIds: ['care', 'youth'],
      }).map(({ name }) => name)
    ).toEqual(['Care group', 'Youth']);
  });

  it('keeps only the chosen calendar day', () => {
    const dated = [
      setlist('Thursday', new Date(2026, 9, 29).toISOString()),
      setlist('Sunday', new Date(2026, 10, 1).toISOString()),
    ];
    expect(
      filterSetlists(dated, { search: '', ownership: 'all', userId: 'me', day: '2026-10-29' }).map(
        ({ name }) => name
      )
    ).toEqual(['Thursday']);
  });
});
