const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const FLAT_MAJOR_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db']);

const PITCH_CLASS: Record<string, number> = { Cb: 11, Fb: 4, 'E#': 5, 'B#': 0 };
SHARPS.forEach((note, index) => (PITCH_CLASS[note] = index));
FLATS.forEach((note, index) => (PITCH_CLASS[note] = index));

const CHORD_PATTERN = /^([A-G](?:#|b)?)([^/\s]*)(?:\/([A-G](?:#|b)?))?$/;
const CHORD_SUFFIX_PATTERN = /^(?:m(?!aj)|min|maj|M|sus|add|dim|aug|\+|°|ø|-|\d|\(|\)|#|b)*$/;

const mod12 = (value: number): number => ((value % 12) + 12) % 12;

const noteAt = (pitchClass: number, flats: boolean): string =>
  (flats ? FLATS : SHARPS)[mod12(pitchClass)] ?? 'C';

const pitchClassOf = (note: string | undefined): number | undefined =>
  note === undefined ? undefined : PITCH_CLASS[note];

export const majorKeyName = (pitchClass: number): string => {
  const flat = noteAt(pitchClass, true);
  return FLAT_MAJOR_KEYS.has(flat) ? flat : noteAt(pitchClass, false);
};

export const minorKeyName = (pitchClass: number): string =>
  `${noteAt(pitchClass, FLAT_MAJOR_KEYS.has(majorKeyName(pitchClass + 3)))}m`;

// Accepts "G", "g major", "B♭ major", "F# minor", "C#m" and returns the app's spelling ("Bb", "F#m").
export const normalizeKey = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const match = /^([A-Ga-g])([#b♯♭]?)\s*(minor|min|major|maj|m)?$/i.exec(
    raw.trim().replace('♭', 'b').replace('♯', '#')
  );
  if (!match) return null;
  const [, letter = '', accidental = '', mode = ''] = match;
  const pitchClass = pitchClassOf(letter.toUpperCase() + accidental);
  if (pitchClass === undefined) return null;
  const minor = /^(minor|min|m)$/i.test(mode) && mode !== 'M';
  return minor ? minorKeyName(pitchClass) : majorKeyName(pitchClass);
};

const keyPitchClass = (key: string): number | undefined => pitchClassOf(key.replace(/m$/, ''));

export const relativeMajor = (key: string): string => {
  const pitchClass = keyPitchClass(key);
  if (pitchClass === undefined) return key;
  return key.endsWith('m') ? majorKeyName(pitchClass + 3) : key;
};

export const isChord = (token: string): boolean => {
  const match = CHORD_PATTERN.exec(token);
  return match !== null && CHORD_SUFFIX_PATTERN.test(match[2] ?? '');
};

const usesFlats = (key: string): boolean => FLAT_MAJOR_KEYS.has(relativeMajor(key));

export const transposeChord = (chord: string, semitones: number, targetKey: string): string => {
  const match = CHORD_PATTERN.exec(chord);
  const root = pitchClassOf(match?.[1]);
  if (!match || root === undefined) return chord;
  const flats = usesFlats(targetKey);
  const bass = pitchClassOf(match[3]);
  const bassName = bass === undefined ? '' : `/${noteAt(bass + semitones, flats)}`;
  return noteAt(root + semitones, flats) + (match[2] ?? '') + bassName;
};

export const transposeChart = (chart: string, semitones: number, targetKey: string): string =>
  chart.replace(/\[([^\]]+)\]/g, (whole, chord: string) =>
    isChord(chord) ? `[${transposeChord(chord, semitones, targetKey)}]` : whole
  );

// Smallest signed distance between two keys, compared through their relative majors.
export const semitonesBetween = (fromKey: string, toKey: string): number => {
  const from = keyPitchClass(relativeMajor(fromKey));
  const to = keyPitchClass(relativeMajor(toKey));
  if (from === undefined || to === undefined) return 0;
  const distance = mod12(to - from);
  return distance > 6 ? distance - 12 : distance;
};

type Quality = 'major' | 'minor' | 'diminished';

const DEGREES: ReadonlyArray<readonly [number, Quality]> = [
  [0, 'major'],
  [2, 'minor'],
  [4, 'minor'],
  [5, 'major'],
  [7, 'major'],
  [9, 'minor'],
  [11, 'diminished'],
];

const qualityOf = (suffix: string): Quality =>
  /^(m(?!aj)|min|-)/.test(suffix) ? 'minor' : /^(dim|°)/.test(suffix) ? 'diminished' : 'major';

export type InferredKey = { key: string; confidence: number };

const chordsIn = (chart: string) =>
  [...chart.matchAll(/\[([^\]]+)\]/g)]
    .map((match) => CHORD_PATTERN.exec((match[1] ?? '').trim()))
    .flatMap((match) => {
      const pitchClass = pitchClassOf(match?.[1]);
      return match && pitchClass !== undefined && CHORD_SUFFIX_PATTERN.test(match[2] ?? '')
        ? [{ pitchClass, quality: qualityOf(match[2] ?? '') }]
        : [];
    });

// Share of the chart's chords whose root and quality belong to the key's diatonic triads.
export const diatonicFit = (chart: string, key: string): number => {
  const tonic = keyPitchClass(relativeMajor(key));
  const chords = chordsIn(chart);
  if (tonic === undefined || chords.length === 0) return 0;
  const fitting = chords.filter(({ pitchClass, quality }) =>
    DEGREES.some(([step, degree]) => mod12(tonic + step) === pitchClass && degree === quality)
  );
  return fitting.length / chords.length;
};

// Scores each major key by how many chords are diatonic to it, nudged towards the first and last chord.
export const inferKey = (chart: string): InferredKey | null => {
  const chords = chordsIn(chart);
  const first = chords[0];
  const last = chords[chords.length - 1];
  if (!first || !last || chords.length < 3) return null;

  const fits = Array.from({ length: 12 }, (_, tonic) => {
    let score = 0;
    for (const { pitchClass, quality } of chords) {
      const degree = DEGREES.find(([step]) => mod12(tonic + step) === pitchClass);
      if (degree) score += degree[1] === quality ? 1 : 0.4;
    }
    return score;
  });
  // The first and last chord only break ties between keys that fit the chords about equally well.
  const bestFit = Math.max(...fits);
  let best = { tonic: 0, score: -1 };
  fits.forEach((fit, tonic) => {
    if (fit < bestFit - 0.5) return;
    let score = fit;
    if (first.pitchClass === tonic && first.quality === 'major') score += 1.5;
    if (last.pitchClass === tonic && last.quality === 'major') score += 1.5;
    if (score > best.score) best = { tonic, score };
  });

  const relativeMinor = mod12(best.tonic + 9);
  const count = (pitchClass: number, quality: Quality) =>
    chords.filter((chord) => chord.pitchClass === pitchClass && chord.quality === quality).length;
  const minorHome =
    count(relativeMinor, 'minor') > count(best.tonic, 'major') &&
    first.pitchClass === relativeMinor &&
    last.pitchClass === relativeMinor;
  return {
    key: minorHome ? minorKeyName(relativeMinor) : majorKeyName(best.tonic),
    confidence: Math.min(1, best.score / (chords.length + 3)),
  };
};
