import { keyLabel, type MusicKey, parseKey } from '@/features/chords/theory';
import type { SongSummary } from '@/features/songs/api';

import type { SetlistSummary } from '../api';
import { fromDateInputValue, toDateInputValue } from '../format-date';
import type { SetlistDraft } from './setlist-draft';

export const SUGGESTED_LIMIT = 8;
export const NEW_SONG_LIMIT = 4;

// A song sung in the set's folders within this many days is resting, not due.
export const REST_DAYS = 28;
// Songs created within this many days, and not in any setlist yet, count as new.
export const NEW_SONG_DAYS = 90;
// A theme on more than this share of the library says little about fit.
export const BROAD_THEME_SHARE = 0.25;

export const SUGGESTION_WEIGHTS = {
  theme: 3,
  broadTheme: 1,
  sameKey: 2,
  relativeKey: 1,
  rested: 4,
  resting: -8,
  timesSung: 1,
  timesSungCap: 3,
} as const;

export type Suggestion = {
  song: SongSummary;
  // `YYYY-MM-DD` of the last set in the set's folders that sang it, or '' when none has.
  lastSung: string;
  // The song's themes that the set already has.
  sharedThemes: string[];
  // One of the song's keys that sits with the set's keys, or '' when none does.
  matchedKey: string;
};

export type Suggestions = {
  suggested: Suggestion[];
  fresh: Suggestion[];
};

type SuggestionInput = {
  library: readonly SongSummary[];
  setlists: readonly SetlistSummary[];
  setlistId: string;
  draft: Pick<SetlistDraft, 'songs' | 'groupIds'>;
  // `YYYY-MM-DD`; only sets dated before it count as sung.
  today: string;
};

type History = { lastSung: string; timesSung: number };

const daysBefore = (day: string, days: number): string => {
  const iso = fromDateInputValue(day);
  if (!iso) return '';
  const date = new Date(iso);
  date.setDate(date.getDate() - days);
  return toDateInputValue(date.toISOString());
};

const relativeOf = (key: MusicKey): Pick<MusicKey, 'root' | 'isMinor'> => ({
  root: (key.root + (key.isMinor ? 3 : 9)) % 12,
  isMinor: !key.isMinor,
});

const sameKey = (a: Pick<MusicKey, 'root' | 'isMinor'>, b: Pick<MusicKey, 'root' | 'isMinor'>) =>
  a.root === b.root && a.isMinor === b.isMinor;

const keyMatch = (
  song: SongSummary,
  setKeys: readonly MusicKey[]
): { matchedKey: string; score: number } => {
  let best = { matchedKey: '', score: 0 };
  for (const text of [song.originalKey, ...(song.recommendedKeys ?? [])]) {
    const key = parseKey(text);
    if (!key) continue;
    for (const setKey of setKeys) {
      const score = sameKey(key, setKey)
        ? SUGGESTION_WEIGHTS.sameKey
        : sameKey(relativeOf(key), setKey)
          ? SUGGESTION_WEIGHTS.relativeKey
          : 0;
      if (score > best.score) best = { matchedKey: keyLabel(key), score };
    }
  }
  return best;
};

const historyScore = ({ lastSung, timesSung }: History, restedSince: string): number => {
  if (timesSung === 0) return 0;
  const rotation = lastSung < restedSince ? SUGGESTION_WEIGHTS.rested : SUGGESTION_WEIGHTS.resting;
  return (
    rotation + Math.min(timesSung, SUGGESTION_WEIGHTS.timesSungCap) * SUGGESTION_WEIGHTS.timesSung
  );
};

// Ranks the library for the set being edited by theme fit, key fit, how long the set's folders
// have rested a song, and how often they have sung it. New songs nobody has planned yet are listed
// apart, so they are not buried under the team's familiar ones.
export const suggestSongs = ({
  library,
  setlists,
  setlistId,
  draft,
  today,
}: SuggestionInput): Suggestions => {
  const others = setlists.filter((setlist) => setlist._id !== setlistId);
  const inSet = new Set(draft.songs.map(({ _id }) => _id));
  const byId = new Map(library.map((song) => [song._id, song]));

  const inFolders = others.filter(
    (setlist) =>
      draft.groupIds.length === 0 || setlist.groupIds.some((id) => draft.groupIds.includes(id))
  );
  const history = new Map<string, History>();
  for (const setlist of inFolders) {
    const date = toDateInputValue(setlist.date);
    if (!date || date >= today) continue;
    for (const { _id } of setlist.songs) {
      const seen = history.get(_id) ?? { lastSung: '', timesSung: 0 };
      history.set(_id, {
        lastSung: date > seen.lastSung ? date : seen.lastSung,
        timesSung: seen.timesSung + 1,
      });
    }
  }

  const themeCounts = new Map<string, number>();
  for (const song of library) {
    for (const theme of song.themes) themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
  }
  const themeWeight = (theme: string) =>
    (themeCounts.get(theme) ?? 0) > library.length * BROAD_THEME_SHARE
      ? SUGGESTION_WEIGHTS.broadTheme
      : SUGGESTION_WEIGHTS.theme;

  const setThemes = new Set(draft.songs.flatMap(({ _id }) => byId.get(_id)?.themes ?? []));
  const setKeys = draft.songs.flatMap(({ key }) => {
    const parsed = parseKey(key);
    return parsed ? [parsed] : [];
  });
  const restedSince = daysBefore(today, REST_DAYS);
  const noHistory: History = { lastSung: '', timesSung: 0 };

  const suggested = library
    .filter((song) => !inSet.has(song._id))
    .map((song) => {
      const songHistory = history.get(song._id) ?? noHistory;
      const sharedThemes = song.themes
        .filter((theme) => setThemes.has(theme))
        .toSorted((a, b) => themeWeight(b) - themeWeight(a));
      const key = keyMatch(song, setKeys);
      const score =
        sharedThemes.reduce((sum, theme) => sum + themeWeight(theme), 0) +
        key.score +
        historyScore(songHistory, restedSince);
      return {
        song,
        sharedThemes,
        matchedKey: key.matchedKey,
        score,
        lastSung: songHistory.lastSung,
        timesSung: songHistory.timesSung,
      };
    })
    .filter(({ score }) => score > 0)
    .toSorted(
      (a, b) =>
        b.score - a.score ||
        b.timesSung - a.timesSung ||
        a.lastSung.localeCompare(b.lastSung) ||
        a.song.title.localeCompare(b.song.title)
    )
    .slice(0, SUGGESTED_LIMIT)
    .map(({ song, lastSung, sharedThemes, matchedKey }) => ({
      song,
      lastSung,
      sharedThemes,
      matchedKey,
    }));

  const planned = new Set(setlists.flatMap(({ songs }) => songs.map(({ _id }) => _id)));
  const taken = new Set([...inSet, ...planned, ...suggested.map(({ song }) => song._id)]);
  const newSince = daysBefore(today, NEW_SONG_DAYS);
  const fresh = library
    .filter((song) => !taken.has(song._id) && toDateInputValue(song.createdAt) >= newSince)
    .toSorted(
      (a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || a.title.localeCompare(b.title)
    )
    .slice(0, NEW_SONG_LIMIT)
    .map((song) => ({ song, lastSung: '', sharedThemes: [], matchedKey: '' }));

  return { suggested, fresh };
};

// "Declaration (Victorious/Kingdom)" reads as "Declaration" in a one-line meta.
export const shortTheme = (theme: string): string => theme.replace(/\s*\(.*\)$/, '');
