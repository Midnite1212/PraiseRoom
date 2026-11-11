import { conventionalKey } from '@/features/chords/key-spelling';
import { keyLabel } from '@/features/chords/theory';

export const IN_TUNE_CENTS = 5;
export const MAX_CENTS = 50;

const A4_FREQUENCY = 440;
const A4_MIDI = 69;
const STANDARD_TUNING_MIDI = [40, 45, 50, 55, 59, 64];

export type Note = { name: string; octave: number; frequency: number };
export type GuitarString = Note & { number: number };
export type TuningState = 'flat' | 'inTune' | 'sharp';
export type TuningReading = { string: GuitarString; cents: number; state: TuningState };

const midiNote = (midi: number): Note => ({
  name: keyLabel(conventionalKey(midi, false)),
  octave: Math.floor(midi / 12) - 1,
  frequency: A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12),
});

export const STANDARD_TUNING: readonly GuitarString[] = STANDARD_TUNING_MIDI.map((midi, index) =>
  Object.assign(midiNote(midi), { number: STANDARD_TUNING_MIDI.length - index })
);

export const noteLabel = (note: Note): string => `${note.name}${note.octave}`;

export const centsBetween = (frequency: number, target: number): number =>
  1200 * Math.log2(frequency / target);

export const nearestNote = (frequency: number): { note: Note; cents: number } => {
  const note = midiNote(Math.round(A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY)));
  return { note, cents: centsBetween(frequency, note.frequency) };
};

export const nearestString = (frequency: number): GuitarString =>
  STANDARD_TUNING.reduce((nearest, string) =>
    Math.abs(centsBetween(frequency, string.frequency)) <
    Math.abs(centsBetween(frequency, nearest.frequency))
      ? string
      : nearest
  );

export const tuningState = (cents: number): TuningState => {
  const rounded = Math.round(cents);
  if (Math.abs(rounded) <= IN_TUNE_CENTS) return 'inTune';
  return rounded < 0 ? 'flat' : 'sharp';
};

export const readTuning = (frequency: number, locked: GuitarString | null): TuningReading => {
  const string = locked ?? nearestString(frequency);
  const cents = centsBetween(frequency, string.frequency);
  return { string, cents, state: tuningState(cents) };
};

export const clampCents = (cents: number): number =>
  Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents));

export const formatCents = (cents: number): string => {
  const rounded = Math.round(cents);
  if (rounded === 0) return '0';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}`;
};
