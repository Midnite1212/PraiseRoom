import { isMinorQuality, type MusicKey, parseChord } from './theory';

// Degrees by semitone above the tonic. Major keys use the major scale; minor keys number from
// the minor tonic with the natural minor scale, so in A minor: Am = 1m, C = 3, G = 7.
const MAJOR_DEGREES = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'] as const;
const MINOR_DEGREES = ['1', 'b2', '2', '3', '#3', '4', '#4', '5', '6', '#6', '7', '#7'] as const;

export type ChordNumber = { degree: string; quality: string; bass: string | null };

const degree = (note: number, key: MusicKey): string =>
  (key.isMinor ? MINOR_DEGREES : MAJOR_DEGREES)[(((note - key.root) % 12) + 12) % 12] ?? '1';

// Minor stays on the degree (`6m`); everything else is an extension the UI raises (`5⁷`).
export const chordToNumberParts = (chord: string, key: MusicKey): ChordNumber | null => {
  const parsed = parseChord(chord);
  if (!parsed) return null;
  const isMinor = isMinorQuality(parsed.quality);
  return {
    degree: `${degree(parsed.root, key)}${isMinor ? 'm' : ''}`,
    quality: isMinor ? parsed.quality.replace(/^(min|m)/, '') : parsed.quality,
    bass: parsed.bass === null ? null : degree(parsed.bass, key),
  };
};

export const chordToNumber = (chord: string, key: MusicKey): string => {
  const parts = chordToNumberParts(chord, key);
  if (!parts) return chord;
  return `${parts.degree}${parts.quality}${parts.bass === null ? '' : `/${parts.bass}`}`;
};
