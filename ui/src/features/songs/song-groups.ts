import type { TFunction } from 'i18next';

import { tempoLabelKey } from '@/components/primitives/tempo-meter';

import type { SongSort, SongSummary } from './api';

export type SongGroup = { id: string; label: string; songs: SongSummary[] };

const OTHER = '#';

// The first-letter filter values: A to Z, and "#" for titles that start with anything else.
export const LETTER_FILTERS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  OTHER,
] as const;

export type LetterFilter = (typeof LETTER_FILTERS)[number];

const leadingLetter = (text: string | null | undefined): string => {
  const first = text?.trim().charAt(0) ?? '';
  return /^[A-Za-z]$/.test(first) ? first.toUpperCase() : OTHER;
};

// Each sort that shows group headings maps a song to its heading.
const GROUP_LABELS: Partial<Record<SongSort, (song: SongSummary, t: TFunction) => string>> = {
  title: (song) => leadingLetter(song.title),
  key: (song, t) => t('songs.groups.key', { key: song.originalKey.trim() || OTHER }),
  tempo: (song, t) => {
    const labelKey = tempoLabelKey(song.tempo);
    return labelKey ? t(labelKey) : t('songs.groups.noTempo');
  },
  code: (song) => leadingLetter(song.code),
};

export const hasGroups = (sort: SongSort): boolean => sort in GROUP_LABELS;

// Splits an already sorted list into runs sharing a heading; null when the sort has no headings or
// the only run is the catch-all "#", which tells the reader nothing.
export const groupSongs = (
  songs: readonly SongSummary[],
  sort: SongSort,
  t: TFunction
): SongGroup[] | null => {
  const labelOf = GROUP_LABELS[sort];
  if (!labelOf) return null;
  const groups: SongGroup[] = [];
  for (const song of songs) {
    const label = labelOf(song, t);
    const last = groups.at(-1);
    if (last?.label === label) last.songs.push(song);
    else groups.push({ id: `song-group-${groups.length}`, label, songs: [song] });
  }
  return groups.length === 1 && groups[0]?.label === OTHER ? null : groups;
};
