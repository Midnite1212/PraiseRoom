import { nextSetlistId, setStatus } from '@/components/primitives/set-status';

type Dated = { _id: string; date?: string | null };

const timeOf = (setlist: Dated): number => {
  const time = setlist.date ? new Date(setlist.date).getTime() : Number.NaN;
  return Number.isNaN(time) ? Infinity : time;
};

const compare = (a: number, b: number) => Number(a > b) - Number(a < b);

// Upcoming sets soonest first, then undated ones, then past sets newest first.
export const orderFolderSetlists = <T extends Dated>(setlists: readonly T[], now: number): T[] => {
  const nextId = nextSetlistId(setlists, now);
  const isUpcoming = (setlist: T) => {
    const status = setStatus(setlist, nextId, now);
    return status === 'next' || status === 'up';
  };
  const upcoming = setlists.filter(isUpcoming).toSorted((a, b) => compare(timeOf(a), timeOf(b)));
  const rest = setlists
    .filter((setlist) => !isUpcoming(setlist))
    .toSorted((a, b) => compare(timeOf(b), timeOf(a)));
  return [...upcoming, ...rest];
};
