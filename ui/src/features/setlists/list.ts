import type { SetlistSummary } from './api';
import { toDateInputValue } from './format-date';

export type SetlistOwnership = 'all' | 'mine' | 'shared';

export type SetlistGroups = {
  // The soonest upcoming setlist, split out of `upcoming` when `leadWithNext` is set.
  next: SetlistSummary | null;
  upcoming: SetlistSummary[];
  past: SetlistSummary[];
  undated: SetlistSummary[];
};

const startOfToday = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

const timeOf = (setlist: SetlistSummary): number | null => {
  if (!setlist.date) return null;
  const time = new Date(setlist.date).getTime();
  return Number.isNaN(time) ? null : time;
};

const byTime = (direction: 1 | -1) => (a: SetlistSummary, b: SetlistSummary) =>
  direction * ((timeOf(a) ?? 0) - (timeOf(b) ?? 0));

// Upcoming soonest first, past most recent first; undated setlists sit apart.
export const groupSetlists = (
  setlists: readonly SetlistSummary[],
  now: Date,
  { leadWithNext = false }: { leadWithNext?: boolean } = {}
): SetlistGroups => {
  const today = startOfToday(now);
  const groups: SetlistGroups = { next: null, upcoming: [], past: [], undated: [] };
  for (const setlist of setlists) {
    const time = timeOf(setlist);
    if (time === null) groups.undated.push(setlist);
    else if (time >= today) groups.upcoming.push(setlist);
    else groups.past.push(setlist);
  }
  groups.upcoming.sort(byTime(1));
  groups.past.sort(byTime(-1));
  groups.undated.sort((a, b) => a.name.localeCompare(b.name));
  if (leadWithNext) groups.next = groups.upcoming.shift() ?? null;
  return groups;
};

export type SetlistFilters = {
  search: string;
  ownership: SetlistOwnership;
  userId: string;
  // Keeps setlists in any of these folders; empty keeps all.
  folderIds?: readonly string[];
  // A local calendar day, `YYYY-MM-DD`.
  day?: string;
};

export const filterSetlists = (
  setlists: readonly SetlistSummary[],
  { search, ownership, userId, folderIds = [], day }: SetlistFilters
): SetlistSummary[] => {
  const query = search.trim().toLocaleLowerCase();
  return setlists.filter((setlist) => {
    if (query && !setlist.name.toLocaleLowerCase().includes(query)) return false;
    if (folderIds.length > 0 && !setlist.groupIds.some((id) => folderIds.includes(id)))
      return false;
    if (day && toDateInputValue(setlist.date) !== day) return false;
    if (ownership === 'mine') return setlist.createdBy === userId;
    if (ownership === 'shared') return setlist.createdBy !== userId;
    return true;
  });
};
