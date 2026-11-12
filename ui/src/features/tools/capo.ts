import { conventionalKey } from '@/features/chords/key-spelling';
import { type MusicKey, semitonesBetween } from '@/features/chords/theory';

// The fret that makes `shapes` sound in `songKey`; 0 is no capo, and it can pass the reader's `MAX_CAPO`.
export const capoForShapes = (songKey: MusicKey, shapes: MusicKey): number =>
  semitonesBetween(shapes, songKey);

// The key heard when `shapes` are played with the capo on `capo`: the inverse of `shapeKey`.
export const soundingKey = (shapes: MusicKey, capo: number): MusicKey =>
  capo === 0 ? shapes : conventionalKey(shapes.root + capo, shapes.isMinor);
