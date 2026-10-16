import type { MusicKey } from './theory';

// Conventional spelling per tonic (index 0 = C): flats where musicians expect them, such as Bb and Eb major.
const MAJOR_PREFERS_FLATS = [
  false,
  true,
  false,
  true,
  false,
  true,
  false,
  false,
  true,
  false,
  true,
  false,
];
const MINOR_PREFERS_FLATS = [
  false,
  false,
  false,
  true,
  false,
  false,
  false,
  false,
  false,
  false,
  true,
  false,
];

export const conventionalKey = (root: number, isMinor: boolean): MusicKey => {
  const index = ((root % 12) + 12) % 12;
  return {
    root: index,
    isMinor,
    prefersFlats: (isMinor ? MINOR_PREFERS_FLATS : MAJOR_PREFERS_FLATS)[index] ?? false,
  };
};

// Shortest signed distance, so moving from G to F reads as -2 rather than +10.
export const signedSemitones = (from: MusicKey, to: MusicKey): number => {
  const up = (((to.root - from.root) % 12) + 12) % 12;
  return up > 6 ? up - 12 : up;
};
