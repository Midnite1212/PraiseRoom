import { createStoredChoice } from '@/lib/stored-choice';

export const ACCENTS = ['electric', 'violet', 'volt', 'signal'] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = 'electric';

const accent = createStoredChoice('accent', ACCENTS, DEFAULT_ACCENT);

export const useAccent = accent.use;

const applyAccent = () => {
  document.documentElement.dataset.palette = accent.read();
};

// Applied with `data-palette` on `<html>`; `src/styles.css` maps it to `--brand`.
export const syncAccent = (): (() => void) => {
  applyAccent();
  return accent.subscribe(applyAccent);
};
