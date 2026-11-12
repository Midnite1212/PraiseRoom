export const TOOLS = ['chords', 'keys', 'capo', 'tuner'] as const;
export type Tool = (typeof TOOLS)[number];
