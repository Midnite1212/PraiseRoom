export const TOOLS = [
  'chords',
  'keys',
  'capo',
  'tuner',
  'metronome',
  'transpose',
  'guides',
] as const;
export type Tool = (typeof TOOLS)[number];
