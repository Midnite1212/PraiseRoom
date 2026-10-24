import { nextSetlistId } from '@/components/primitives/set-status';
import type { SetlistSummary } from '@/features/setlists/api';

export const GLYPH_SIZE = 5;
const GLYPH_HALF = Math.ceil(GLYPH_SIZE / 2);
const MIN_LIT = 9;
const MAX_LIT = 16;
const MAX_TRIES = 64;

// One `[data-cover-hue]` rule per hue in src/styles.css.
export const COVER_HUES = 8;

export type FolderCover = { glyph: readonly boolean[]; hue: number };

// FNV-1a over the id's characters.
const hashId = (id: string): number => {
  let hash = 0x811c9dc5;
  for (const char of id) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

// Mulberry32: a small seeded generator, so a folder draws the same glyph on every device.
const seededRandom = (seed: number) => {
  let state = seed;
  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const mirror = (half: readonly boolean[]): boolean[] =>
  Array.from({ length: GLYPH_SIZE * GLYPH_SIZE }, (_, index) => {
    const row = Math.floor(index / GLYPH_SIZE);
    const column = index % GLYPH_SIZE;
    return half[row * GLYPH_HALF + Math.min(column, GLYPH_SIZE - 1 - column)] ?? false;
  });

const isBalanced = (glyph: readonly boolean[]): boolean => {
  const lit = glyph.filter(Boolean).length;
  const centre = glyph.some((on, index) => on && index % GLYPH_SIZE === GLYPH_HALF - 1);
  return lit >= MIN_LIT && lit <= MAX_LIT && centre;
};

// A folder's cover: a mirrored 5×5 pixel glyph and a hue, both drawn from its id so they never change.
export const folderCover = (folderId: string): FolderCover => {
  const seed = hashId(folderId);
  const random = seededRandom(seed);
  let glyph: boolean[] = [];
  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    glyph = mirror(Array.from({ length: GLYPH_SIZE * GLYPH_HALF }, () => random() < 0.5));
    if (isBalanced(glyph)) break;
  }
  return { glyph, hue: (seed >>> 5) % COVER_HUES };
};

type CoverSetlist = Pick<SetlistSummary, '_id' | 'date'>;

// The folder's soonest setlist dated today or later.
export const nextFolderDate = (setlists: readonly CoverSetlist[], now: number): string | null => {
  const nextId = nextSetlistId(setlists, now);
  return setlists.find(({ _id }) => _id === nextId)?.date ?? null;
};
