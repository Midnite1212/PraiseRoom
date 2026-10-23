import type { SongSort, SongSummary } from './api';

export type SongGroup = { id: string; label: string; songs: SongSummary[] };

const OTHER = '#';

const leadingLetter = (text: string | null | undefined): string => {
  const first = text?.trim().charAt(0) ?? '';
  return /^[A-Za-z]$/.test(first) ? first.toUpperCase() : OTHER;
};

// Each sort that shows group headings maps a song to its heading; key and tempo sorts add an entry here.
const GROUP_LABELS: Partial<Record<SongSort, (song: SongSummary) => string>> = {
  title: (song) => leadingLetter(song.title),
  code: (song) => leadingLetter(song.code),
};

export const hasGroups = (sort: SongSort): boolean => sort in GROUP_LABELS;

// Splits an already sorted list into runs sharing a heading; null when the sort has no headings or
// the only run is the catch-all "#", which tells the reader nothing.
export const groupSongs = (songs: readonly SongSummary[], sort: SongSort): SongGroup[] | null => {
  const labelOf = GROUP_LABELS[sort];
  if (!labelOf) return null;
  const groups: SongGroup[] = [];
  for (const song of songs) {
    const label = labelOf(song);
    const last = groups.at(-1);
    if (last?.label === label) last.songs.push(song);
    else groups.push({ id: `song-group-${groups.length}`, label, songs: [song] });
  }
  return groups.length === 1 && groups[0]?.label === OTHER ? null : groups;
};
