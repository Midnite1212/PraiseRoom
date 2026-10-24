import { createStoredChoice } from '@/lib/stored-choice';

export const TYPEFACES = ['plex', 'geist', 'hanken-grotesk', 'pixel', 'mono', 'system'] as const;

export type Typeface = (typeof TYPEFACES)[number];

export const DEFAULT_TYPEFACE: Typeface = 'plex';

const STORAGE_KEY = 'typeface';
const MIGRATED_KEY = 'typeface-plex-default';

const typeface = createStoredChoice(STORAGE_KEY, TYPEFACES, DEFAULT_TYPEFACE);

export const readTypeface = typeface.read;
export const setTypeface = typeface.write;
export const useTypeface = typeface.use;

// Geist was the default and the Settings tile that wrote it was also the untouched choice, so a stored
// `geist` is treated as the old default and moves to IBM Plex once; picking Geist afterwards sticks.
const moveOldDefaultToPlex = (): void => {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    localStorage.setItem(MIGRATED_KEY, '1');
    if (localStorage.getItem(STORAGE_KEY) === 'geist') localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Blocked storage: nothing was stored to migrate.
  }
};

const applyTypeface = () => {
  document.documentElement.dataset.typeface = typeface.read();
};

// Applied with `data-typeface` on `<html>`; `src/styles.css` maps it to `--typeface-sans`.
export const syncTypeface = (): (() => void) => {
  moveOldDefaultToPlex();
  applyTypeface();
  return typeface.subscribe(applyTypeface);
};
