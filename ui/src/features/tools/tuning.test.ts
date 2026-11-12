import { describe, expect, it } from 'vitest';

import {
  centsBetween,
  clampCents,
  formatCents,
  type GuitarString,
  nearestNote,
  nearestString,
  noteLabel,
  readTuning,
  STANDARD_TUNING,
  tuningState,
} from './tuning';

const stringNumbered = (number: number): GuitarString => {
  const string = STANDARD_TUNING.find((candidate) => candidate.number === number);
  if (!string) throw new Error(`No string ${number}`);
  return string;
};

describe('STANDARD_TUNING', () => {
  it('is E2 A2 D3 G3 B3 E4 from string 6 to string 1', () => {
    expect(STANDARD_TUNING.map(noteLabel)).toEqual(['E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
    expect(STANDARD_TUNING.map((string) => string.number)).toEqual([6, 5, 4, 3, 2, 1]);
    expect(STANDARD_TUNING.map((string) => Number(string.frequency.toFixed(2)))).toEqual([
      82.41, 110, 146.83, 196, 246.94, 329.63,
    ]);
  });
});

describe('centsBetween', () => {
  it('is negative when flat, positive when sharp, and 100 per semitone', () => {
    expect(centsBetween(110, 110)).toBe(0);
    expect(centsBetween(108, 110)).toBeCloseTo(-31.77, 2);
    expect(centsBetween(112, 110)).toBeCloseTo(31.19, 2);
    expect(centsBetween(220, 110)).toBeCloseTo(1200, 6);
    expect(centsBetween(110, 220)).toBeCloseTo(-1200, 6);
    expect(centsBetween(116.54, 110)).toBeCloseTo(100, 1);
  });
});

describe('nearestNote', () => {
  it('names the closest note and how far off it is', () => {
    expect(nearestNote(440)).toMatchObject({ note: { name: 'A', octave: 4 }, cents: 0 });
    expect(noteLabel(nearestNote(261.63).note)).toBe('C4');
    expect(noteLabel(nearestNote(108).note)).toBe('A2');
    expect(nearestNote(108).cents).toBeCloseTo(-31.77, 2);
    expect(nearestNote(113.5).cents).toBeCloseTo(-45.77, 2);
  });

  it('spells accidentals the way the chord charts do', () => {
    expect(noteLabel(nearestNote(466.16).note)).toBe('Bb4');
    expect(noteLabel(nearestNote(185).note)).toBe('F#3');
  });
});

describe('nearestString', () => {
  it('picks each string at its own pitch', () => {
    for (const string of STANDARD_TUNING) {
      expect(nearestString(string.frequency)).toBe(string);
    }
  });

  it('switches string at the midpoint between two neighbours', () => {
    for (const upper of STANDARD_TUNING.slice(1)) {
      const lower = stringNumbered(upper.number + 1);
      const midpoint = Math.sqrt(lower.frequency * upper.frequency);

      expect(nearestString(midpoint * 0.999)).toBe(lower);
      expect(nearestString(midpoint * 1.001)).toBe(upper);
    }
  });

  it('keeps the outer strings for anything beyond them', () => {
    expect(nearestString(61).number).toBe(6);
    expect(nearestString(480).number).toBe(1);
  });
});

describe('tuningState', () => {
  it('is in tune within five cents either way', () => {
    expect(tuningState(0)).toBe('inTune');
    expect(tuningState(5.4)).toBe('inTune');
    expect(tuningState(-5.4)).toBe('inTune');
    expect(tuningState(5.6)).toBe('sharp');
    expect(tuningState(-5.6)).toBe('flat');
    expect(tuningState(-32)).toBe('flat');
    expect(tuningState(480)).toBe('sharp');
  });
});

describe('readTuning', () => {
  it('reads against the nearest string when none is locked', () => {
    const reading = readTuning(108, null);

    expect(reading.string.number).toBe(5);
    expect(reading.cents).toBeCloseTo(-31.77, 2);
    expect(reading.state).toBe('flat');
  });

  it('reads against the locked string however far away the pitch is', () => {
    const lowE = stringNumbered(6);
    const reading = readTuning(108, lowE);

    expect(reading.string).toBe(lowE);
    expect(reading.cents).toBeCloseTo(468.2, 1);
    expect(reading.state).toBe('sharp');
    expect(readTuning(82.5, lowE).state).toBe('inTune');
    expect(readTuning(329.63, lowE).cents).toBeCloseTo(2400, 0);
  });
});

describe('clampCents and formatCents', () => {
  it('keeps the needle within fifty cents', () => {
    expect(clampCents(12.5)).toBe(12.5);
    expect(clampCents(468)).toBe(50);
    expect(clampCents(-180)).toBe(-50);
  });

  it('writes whole cents with a sign', () => {
    expect(formatCents(12.4)).toBe('+12');
    expect(formatCents(-31.77)).toBe('−32');
    expect(formatCents(0.4)).toBe('0');
    expect(formatCents(-0.4)).toBe('0');
  });
});
