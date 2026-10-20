import { createStoredChoice } from '@/lib/stored-choice';

export const TYPEFACES = ['geist', 'hanken-grotesk', 'pixel', 'mono', 'system'] as const;

export type Typeface = (typeof TYPEFACES)[number];

export const DEFAULT_TYPEFACE: Typeface = 'geist';

const typeface = createStoredChoice('typeface', TYPEFACES, DEFAULT_TYPEFACE);

export const readTypeface = typeface.read;
export const setTypeface = typeface.write;
export const useTypeface = typeface.use;

const applyTypeface = () => {
  document.documentElement.dataset.typeface = typeface.read();
};

// Applied with `data-typeface` on `<html>`; `src/styles.css` maps it to `--typeface-sans`.
export const syncTypeface = (): (() => void) => {
  applyTypeface();
  return typeface.subscribe(applyTypeface);
};
