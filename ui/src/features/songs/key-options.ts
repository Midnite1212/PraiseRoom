import { conventionalKey } from '@/features/chords/key-spelling';
import { type MusicKey, parseKey, semitonesBetween } from '@/features/chords/theory';

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
