import { datasetSuffix } from '@/features/chords/chord-shapes';
import { conventionalKey } from '@/features/chords/key-spelling';
import {
  ALL_KEY_ROOTS,
  isMinorQuality,
  keyLabel,
  noteName,
  parseChord,
} from '@/features/chords/theory';

// Most used first; every one has a shape on all twelve roots in the guitar dataset.
export const LIBRARY_QUALITIES = [
  '',
  'm',
  '7',
  'm7',
  'maj7',
  'sus4',
  'sus2',
  'add9',
  '6',
  'm6',
  '9',
  'm9',
  'maj9',
  '7sus4',
  'madd9',
  'dim',
  'dim7',
  'm7b5',
  'aug',
  'aug7',
  '11',
  'm11',
  'maj11',
  '13',
  'maj13',
  '69',
  'm69',
  'mmaj7',
  'mmaj9',
  'mmaj11',
  'mmaj7b5',
  '7b5',
  '7b9',
  '7#9',
  '9b5',
  'aug9',
  '9#11',
  'maj7b5',
  'maj7#5',
] as const;

const ROOTED_QUERY = /^([A-Ga-g][#b]?)(.*)$/;

const cleanQuery = (query: string): string =>
  query.replace(/\s+/g, '').replace(/♭/g, 'b').replace(/♯/g, '#');

const upperNote = (note: string): string => `${note.charAt(0).toUpperCase()}${note.slice(1)}`;

const chordsOnEveryRoot = (quality: string): string[] =>
  ALL_KEY_ROOTS.map((root) => {
    const { prefersFlats } = conventionalKey(root, isMinorQuality(quality));
    return `${noteName(root, prefersFlats)}${quality}`;
  });

// The quality as typed (`min7`, `M7`, `2`) first, then every quality it begins.
const qualitiesMatching = (typed: string): string[] => {
  const suffix = datasetSuffix(typed);
  const exact = LIBRARY_QUALITIES.filter((quality) => datasetSuffix(quality) === suffix);
  const begun = LIBRARY_QUALITIES.filter(
    (quality) => quality.startsWith(typed) && datasetSuffix(quality) !== suffix
  );
  return [...exact, ...begun];
};

export const BROWSE_CHORDS: readonly string[] = ALL_KEY_ROOTS.flatMap((root) => [
  keyLabel(conventionalKey(root, false)),
  keyLabel(conventionalKey(root, true)),
]);

// Chord names for what was typed: a root lists its chords (`Bb`, `Em7`), a bare quality lists it on
// every root (`sus4`), and any other readable chord (`D/F#`) is returned as typed. Empty lists the
// major and minor chords.
export const searchChords = (query: string): string[] => {
  const typed = cleanQuery(query);
  if (!typed) return [...BROWSE_CHORDS];

  const [, root = '', rest = ''] = ROOTED_QUERY.exec(typed) ?? [];
  if (root) {
    const qualities = qualitiesMatching(rest);
    if (qualities.length > 0) return qualities.map((quality) => `${upperNote(root)}${quality}`);
  }

  const onEveryRoot = LIBRARY_QUALITIES.filter(
    (quality) => quality !== '' && quality.startsWith(typed)
  );
  if (onEveryRoot.length > 0) return onEveryRoot.flatMap(chordsOnEveryRoot);

  if (!parseChord(typed)) return [];
  return [
    upperNote(typed).replace(/\/([a-g])/, (_match, bass: string) => `/${bass.toUpperCase()}`),
  ];
};
