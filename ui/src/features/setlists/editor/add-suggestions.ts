import type { SongSummary } from '@/features/songs/api';

import type { SetlistSummary } from '../api';
import { toDateInputValue } from '../format-date';
import type { SetlistDraft } from './setlist-draft';

export const SUGGESTIONS_PER_GROUP = 4;

export type Suggestion = {
  song: SongSummary;
  // `YYYY-MM-DD` of the last played set, or '' when the song has not been sung.
  lastSung: string;
  // The song's themes that the set already has.
  sharedThemes: string[];
};

export type Suggestions = {
  recent: Suggestion[];
  lately: Suggestion[];
  fits: Suggestion[];
};

type SuggestionInput = {
  library: readonly SongSummary[];
  setlists: readonly SetlistSummary[];
  setlistId: string;
  draft: Pick<SetlistDraft, 'songs' | 'groupIds'>;
  // `YYYY-MM-DD`; only sets dated before it count as sung.
  today: string;
};

const byTitle = (a: SongSummary, b: SongSummary) => a.title.localeCompare(b.title);

// Songs to offer before the user types: from the set's folders, not sung for the longest, and
// sharing themes with the set. Each song shows in the first group it qualifies for.
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

  const lastSung = new Map<string, string>();
  for (const setlist of others) {
    const date = toDateInputValue(setlist.date);
    if (!date || date >= today) continue;
    for (const { _id } of setlist.songs) {
      if (date > (lastSung.get(_id) ?? '')) lastSung.set(_id, date);
    }
  }

  const suggestion = (song: SongSummary, sharedThemes: string[] = []): Suggestion => ({
    song,
    lastSung: lastSung.get(song._id) ?? '',
    sharedThemes,
  });

  const inFolders = others
    .filter(
      (setlist) =>
        draft.groupIds.length === 0 || setlist.groupIds.some((id) => draft.groupIds.includes(id))
    )
    .toSorted((a, b) => toDateInputValue(b.date).localeCompare(toDateInputValue(a.date)));
  const recentIds = [...new Set(inFolders.flatMap(({ songs }) => songs.map(({ _id }) => _id)))]
    .filter((id) => !inSet.has(id) && byId.has(id))
    .slice(0, SUGGESTIONS_PER_GROUP);
  const recent = recentIds.flatMap((id) => {
    const song = byId.get(id);
    return song ? [suggestion(song)] : [];
  });
  const taken = new Set([...inSet, ...recentIds]);

  const lately = library
    .filter((song) => !taken.has(song._id))
    .toSorted(
      (a, b) =>
        (lastSung.get(a._id) ?? '').localeCompare(lastSung.get(b._id) ?? '') || byTitle(a, b)
    )
    .slice(0, SUGGESTIONS_PER_GROUP)
    .map((song) => suggestion(song));
  for (const { song } of lately) taken.add(song._id);

  const setThemes = new Set(draft.songs.flatMap(({ _id }) => byId.get(_id)?.themes ?? []));
  const fits = library
    .filter((song) => !taken.has(song._id))
    .map((song) => ({ song, shared: song.themes.filter((theme) => setThemes.has(theme)) }))
    .filter(({ shared }) => shared.length > 0)
    .toSorted((a, b) => b.shared.length - a.shared.length || byTitle(a.song, b.song))
    .slice(0, SUGGESTIONS_PER_GROUP)
    .map(({ song, shared }) => suggestion(song, shared));

  return { recent, lately, fits };
};

// "Declaration (Victorious/Kingdom)" reads as "Declaration" in a one-line meta.
export const shortTheme = (theme: string): string => theme.replace(/\s*\(.*\)$/, '');
