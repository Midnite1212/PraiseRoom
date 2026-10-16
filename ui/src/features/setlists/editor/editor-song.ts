import { conventionalKey } from '@/features/chords/key-spelling';
import { keyLabel, parseKey } from '@/features/chords/theory';

export type EditorSong = {
  _id: string;
  title: string;
  artist: string;
  originalKey: string;
  key: string;
};

export const keyOptionsFor = (originalKey: string): string[] => {
  const parsed = parseKey(originalKey);
  if (!parsed) return [];
  return Array.from({ length: 12 }, (_, root) => keyLabel(conventionalKey(root, parsed.isMinor)));
};

// Only keys that differ from the song's own key are stored, matching how the API reads `songKeys`.
export const toSongKeys = (songs: readonly EditorSong[]) =>
  songs.flatMap(({ _id, key, originalKey }) => {
    const chosen = parseKey(key);
    const original = parseKey(originalKey);
    return chosen && original && chosen.root !== original.root ? [{ songId: _id, key }] : [];
  });

export const moveItem = <T>(items: readonly T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length || from === to) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
};
