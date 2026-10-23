import { nextSetlistId } from '@/components/primitives/set-status';
import type { SetlistSummary } from '@/features/setlists/api';

// The ids of the songs in the soonest set dated today or later.
export const nextSetSongIds = (
  setlists: readonly SetlistSummary[],
  now: number
): ReadonlySet<string> => {
  const nextId = nextSetlistId(setlists, now);
  const next = setlists.find((setlist) => setlist._id === nextId);
  return new Set(next?.songs.map((song) => song._id));
};
