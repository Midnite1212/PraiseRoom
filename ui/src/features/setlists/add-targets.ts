import type { Session } from '@/features/auth/session';

import type { SetlistSummary } from './api';
import { groupSetlists } from './list';
import { canEditSetlist } from './permissions';

export type AddTarget = { setlist: SetlistSummary; hasSong: boolean };

// The setlists a song can join: ones you can edit that are upcoming (soonest first) or undated.
export const addTargets = (
  setlists: readonly SetlistSummary[],
  session: Session,
  songId: string,
  now: Date
): AddTarget[] => {
  const { upcoming, undated } = groupSetlists(
    setlists.filter((setlist) => canEditSetlist(session, setlist)),
    now
  );
  return [...upcoming, ...undated].map((setlist) => ({
    setlist,
    hasSong: setlist.songs.some(({ _id }) => _id === songId),
  }));
};
