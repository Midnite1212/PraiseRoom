const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const ENHARMONIC_EXTRAS: Record<string, number> = { Cb: 11, Fb: 4, 'E#': 5, 'B#': 0 };

const NOTE = '[A-Ga-g][#b]?';
const QUALITY_TOKEN = 'maj|min|dim|aug|sus|add|M|m|°|ø|\\+|6\\/9|[#b]?\\d+';
const QUALITY = `(?:${QUALITY_TOKEN}|\\((?:${QUALITY_TOKEN}|,)+\\))*`;
const CHORD_PATTERN = new RegExp(`^(${NOTE})(${QUALITY})(?:\\/(${NOTE}))?$`);
const KEY_PATTERN = /^([A-G][#b]?)(m?)$/;

export type ParsedChord = { root: number; quality: string; bass: number | null };

export type MusicKey = { root: number; isMinor: boolean; prefersFlats: boolean };

const capitalise = (note: string) => `${note[0]?.toUpperCase() ?? ''}${note.slice(1)}`;

export const noteIndex = (note: string): number | null => {
  const name = capitalise(note);
  const sharp = SHARP_NOTES.findIndex((candidate) => candidate === name);
  if (sharp >= 0) return sharp;
  const flat = FLAT_NOTES.findIndex((candidate) => candidate === name);
  if (flat >= 0) return flat;
  return ENHARMONIC_EXTRAS[name] ?? null;
};

export const noteName = (index: number, useFlats: boolean): string =>
  (useFlats ? FLAT_NOTES : SHARP_NOTES)[((index % 12) + 12) % 12] ?? 'C';

export const parseChord = (chord: string): ParsedChord | null => {
  const match = CHORD_PATTERN.exec(chord.trim());
  if (!match) return null;
  const [, rootName = '', quality = '', bassName] = match;
  const root = noteIndex(rootName);
  const bass = bassName === undefined ? null : noteIndex(bassName);
  if (root === null || (bassName !== undefined && bass === null)) return null;
  return { root, quality, bass };
};

export const isMinorQuality = (quality: string): boolean => /^(m(?!aj)|min)/.test(quality);

// Root and minor only: `F#m7/C#` becomes `F#m`, `Gsus4` and `G7` become `G`.
export const simplifyChord = (chord: string): string => {
  const match = CHORD_PATTERN.exec(chord.trim());
  if (!match) return chord;
  const [, root = '', quality = ''] = match;
  return `${root}${isMinorQuality(quality) ? 'm' : ''}`;
};

export const parseKey = (key: string | null | undefined): MusicKey | null => {
  const match = KEY_PATTERN.exec(key?.trim() ?? '');
  if (!match) return null;
  const [, rootName = '', minor] = match;
  const root = noteIndex(rootName);
  if (root === null) return null;
  return { root, isMinor: minor === 'm', prefersFlats: rootName.endsWith('b') || rootName === 'F' };
};

export const keyLabel = (key: MusicKey): string =>
  `${noteName(key.root, key.prefersFlats)}${key.isMinor ? 'm' : ''}`;

export const transposeKey = (key: MusicKey, semitones: number, useFlats: boolean): MusicKey => ({
  root: (((key.root + semitones) % 12) + 12) % 12,
  isMinor: key.isMinor,
  prefersFlats: useFlats,
});

export const semitonesBetween = (from: MusicKey, to: MusicKey): number =>
  (((to.root - from.root) % 12) + 12) % 12;

// Unparseable text inside brackets (a cue like "[x2]") is returned untouched.
export const transposeChord = (chord: string, semitones: number, useFlats: boolean): string => {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  const root = noteName(parsed.root + semitones, useFlats);
  const bass = parsed.bass === null ? '' : `/${noteName(parsed.bass + semitones, useFlats)}`;
  return `${root}${parsed.quality}${bass}`;
};

export const ALL_KEY_ROOTS = SHARP_NOTES.map((_, index) => index);

// Transposes every `[chord]` token in chord/lyrics text; section headers, lyrics, and
// unparseable cues (such as "[x2]") pass through untouched via `transposeChord`.
export const transposeChordLyrics = (text: string, semitones: number, useFlats: boolean): string =>
  text.replace(
    /\[([^[\]]*)\]/g,
    (_match, chord) => `[${transposeChord(chord, semitones, useFlats)}]`
  );
