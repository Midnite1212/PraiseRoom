export const TOOLS = ['chords', 'keys', 'capo', 'tuner', 'metronome'] as const;
export type Tool = (typeof TOOLS)[number];
