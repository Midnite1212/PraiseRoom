import type { SetlistSummary } from './api';

export type SetlistOwnership = 'all' | 'mine' | 'shared';

export type SetlistGroups = {
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
export const groupSetlists = (setlists: readonly SetlistSummary[], now: Date): SetlistGroups => {
  const today = startOfToday(now);
  const groups: SetlistGroups = { upcoming: [], past: [], undated: [] };
  for (const setlist of setlists) {
    const time = timeOf(setlist);
    if (time === null) groups.undated.push(setlist);
    else if (time >= today) groups.upcoming.push(setlist);
    else groups.past.push(setlist);
  }
  groups.upcoming.sort(byTime(1));
  groups.past.sort(byTime(-1));
  groups.undated.sort((a, b) => a.name.localeCompare(b.name));
  return groups;
};

export const filterSetlists = (
  setlists: readonly SetlistSummary[],
  { search, ownership, userId }: { search: string; ownership: SetlistOwnership; userId: string }
): SetlistSummary[] => {
  const query = search.trim().toLocaleLowerCase();
  return setlists.filter((setlist) => {
    if (query && !setlist.name.toLocaleLowerCase().includes(query)) return false;
    if (ownership === 'mine') return setlist.createdBy === userId;
    if (ownership === 'shared') return setlist.createdBy !== userId;
    return true;
  });
};
