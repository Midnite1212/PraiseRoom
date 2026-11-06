import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { noteIndex, parseChord } from './theory';

const STRINGS = 6;

const shapeSchema = z.object({
  frets: z.array(z.number().int().min(-1)).length(STRINGS),
  fingers: z.array(z.number().int().min(0)).length(STRINGS),
  baseFret: z.number().int().min(1),
  barres: z.array(z.number().int().min(1)),
});

const guitarChordsSchema = z.object({
  chords: z.record(
    z.string(),
    z.array(z.object({ key: z.string(), suffix: z.string(), positions: z.array(shapeSchema) }))
  ),
});

// Frets are relative to `baseFret` (1 = the first fret drawn); -1 is a muted string, 0 an open one.
export type ChordShape = z.infer<typeof shapeSchema>;

export type ChordShapeDb = ReadonlyMap<string, ChordShape[]>;

const SLASH_SUFFIX = /^(m?)\/([A-G][#b]?)$/;

const SUFFIX_ALIASES: Record<string, string> = {
  '': 'major',
  maj: 'major',
  m: 'minor',
  '2': 'sus2',
  '4': 'sus4',
  sus: 'sus4',
  '7sus': '7sus4',
  add2: 'add9',
  madd2: 'madd9',
  '+': 'aug',
  '+7': 'aug7',
  '7+': 'aug7',
  '7#5': 'aug7',
  '6/9': '69',
  'm6/9': 'm69',
  '°': 'dim',
  '°7': 'dim7',
  ø: 'm7b5',
  ø7: 'm7b5',
};

const shapeId = (root: number, suffix: string) => `${root}:${suffix}`;

// A chord's quality in the dataset's suffix naming: `min7` and `m7` are `m7`, `M7` is `maj7`, `+` is `aug`.
export const datasetSuffix = (quality: string): string => {
  const plain = quality
    .replace(/[(),\s]/g, '')
    .replace(/^min/, 'm')
    .replace(/M(?=\d)/g, 'maj');
  return SUFFIX_ALIASES[plain] ?? plain;
};

// Keyed by root and suffix, with slash suffixes keyed by the bass note's index so `D/F#` and `D/Gb` meet.
export const buildChordShapeDb = (data: unknown): ChordShapeDb => {
  const db = new Map<string, ChordShape[]>();
  for (const entries of Object.values(guitarChordsSchema.parse(data).chords)) {
    for (const { key, suffix, positions } of entries) {
      const root = noteIndex(key);
      if (root === null || positions.length === 0) continue;
      const slash = SLASH_SUFFIX.exec(suffix);
      const bass = slash?.[2] === undefined ? null : noteIndex(slash[2]);
      db.set(shapeId(root, bass === null ? suffix : `${slash?.[1] ?? ''}/${bass}`), positions);
    }
  }
  return db;
};

// Shapes for a chord name; a slash chord uses its own voicing when the dataset has one, else the
// chord above the slash. Empty when the chord can't be read or the dataset has no shape for it.
export const findChordShapes = (db: ChordShapeDb, chord: string): ChordShape[] => {
  const parsed = parseChord(chord);
  if (!parsed) return [];
  const suffix = datasetSuffix(parsed.quality);
  if (parsed.bass !== null && parsed.bass !== parsed.root) {
    const prefix = suffix === 'major' ? '' : suffix === 'minor' ? 'm' : null;
    const slashShapes =
      prefix === null ? undefined : db.get(shapeId(parsed.root, `${prefix}/${parsed.bass}`));
    if (slashShapes) return slashShapes;
  }
  return db.get(shapeId(parsed.root, suffix)) ?? [];
};

// Tab order from the low E string: `x` muted, `0` open, otherwise the fret on the neck.
export const shapeTab = ({ frets, baseFret }: ChordShape): string =>
  frets.map((fret) => (fret < 0 ? 'x' : fret === 0 ? '0' : String(fret + baseFret - 1))).join(' ');

export type BarreSpan = { fret: number; from: number; to: number; finger: number };

// A barre runs from the lowest to the highest string held at its fret; the strings between that sit
// higher up the neck keep their own dots.
export const barreSpans = ({ frets, fingers, barres }: ChordShape): BarreSpan[] =>
  barres.flatMap((fret) => {
    const from = frets.indexOf(fret);
    const to = frets.lastIndexOf(fret);
    return from < 0 || from === to ? [] : [{ fret, from, to, finger: fingers[from] ?? 0 }];
  });

export const isUnderBarre = (spans: BarreSpan[], string: number, fret: number): boolean =>
  spans.some((span) => span.fret === fret && string >= span.from && string <= span.to);

export const guitarChordsQueryOptions = queryOptions({
  queryKey: ['chords', 'guitar-shapes'],
  queryFn: async () => {
    const { default: raw } = await import('@tombatossals/chords-db/lib/guitar.json?raw');
    return buildChordShapeDb(JSON.parse(raw));
  },
  staleTime: Infinity,
  gcTime: Infinity,
});
