import { conventionalKey } from '@/features/chords/key-spelling';
import { type MusicKey, noteName, parseKey, semitonesBetween } from '@/features/chords/theory';

export const KEY_OPTIONS: readonly MusicKey[] = [
  ...Array.from({ length: 12 }, (_, root) => conventionalKey(root, false)),
  ...Array.from({ length: 12 }, (_, root) => conventionalKey(root, true)),
];

export const keyOptionValue = (key: MusicKey): string => `${key.root}-${key.isMinor ? 'm' : 'M'}`;

export const initialKey = (originalKey: string | null): MusicKey => {
  const parsed = parseKey(originalKey);
  return parsed ? conventionalKey(parsed.root, parsed.isMinor) : conventionalKey(0, false);
};

const relativeMajor = (key: MusicKey): MusicKey =>
  key.isMinor ? { ...key, root: (key.root + 3) % 12, isMinor: false } : key;

// Relative keys (G and Em) share their chords, so the distance is measured between relative majors.
export const semitonesToKey = (from: MusicKey, to: MusicKey): number =>
  semitonesBetween(relativeMajor(from), relativeMajor(to));

// The filter grid has one button per tonic; a tonic stands for its major and its minor key.
export const KEY_FILTER_OPTIONS = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export type KeyFilterOption = (typeof KEY_FILTER_OPTIONS)[number];

export const tonicOf = (originalKey: string): KeyFilterOption | null => {
  const parsed = parseKey(originalKey);
  return KEY_FILTER_OPTIONS.find((option) => parseKey(option)?.root === parsed?.root) ?? null;
};

// Every way a song may spell the chosen tonics' keys (C#, Db, Dbm, ...), for the search API.
export const keyFilterSpellings = (tonics: readonly string[]): string[] => {
  const spellings = tonics.flatMap((tonic) => {
    const root = parseKey(tonic)?.root;
    if (root === undefined) return [];
    return [noteName(root, false), noteName(root, true)].flatMap((name) => [name, `${name}m`]);
  });
  return [...new Set(spellings)];
};
