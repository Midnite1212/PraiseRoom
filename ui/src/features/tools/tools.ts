export const TOOLS = ['chords', 'keys', 'capo'] as const;
export type Tool = (typeof TOOLS)[number];
