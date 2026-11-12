export const TOOLS = ['chords', 'keys', 'capo', 'tuner', 'metronome', 'transpose'] as const;
export type Tool = (typeof TOOLS)[number];
