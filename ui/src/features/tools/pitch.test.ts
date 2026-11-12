import { describe, expect, it } from 'vitest';

import { analysisWindowSize, detectPitch, EMPTY_TRACK, type PitchTrack, trackPitch } from './pitch';
import { centsBetween, nearestNote, noteLabel, STANDARD_TUNING } from './tuning';

type Overtone = { harmonic: number; level: number };

const SINE: Overtone[] = [{ harmonic: 1, level: 1 }];
const GUITAR: Overtone[] = [
  { harmonic: 1, level: 1 },
  { harmonic: 2, level: 2 },
  { harmonic: 3, level: 1.5 },
  { harmonic: 4, level: 0.7 },
];
const SAMPLE_RATES = [44_100, 48_000];

const tone = (
  frequency: number,
  sampleRate: number,
  { partials = SINE, decay = 0, level = 0.1, offset = 0 } = {}
): Float32Array =>
  Float32Array.from({ length: analysisWindowSize(sampleRate) }, (_, index) => {
    const time = index / sampleRate;
    const wave = partials.reduce(
      (sum, partial) =>
        sum +
        partial.level *
          Math.sin(2 * Math.PI * partial.harmonic * frequency * time + partial.harmonic),
      0
    );
    return offset + level * wave * Math.exp(-decay * time);
  });

const whiteNoise = (size: number, level: number, seed: number): Float32Array => {
  let state = seed;
  return Float32Array.from({ length: size }, () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return level * (state / 2 ** 31 - 1);
  });
};

const centsOff = (samples: Float32Array, sampleRate: number, expected: number): number => {
  const pitch = detectPitch(samples, sampleRate);
  return pitch ? Math.abs(centsBetween(pitch.frequency, expected)) : Infinity;
};

describe('detectPitch', () => {
  it.each(STANDARD_TUNING)('reads a pure sine at string $number', ({ frequency }) => {
    for (const sampleRate of SAMPLE_RATES) {
      const pitch = detectPitch(tone(frequency, sampleRate), sampleRate);
      expect(pitch?.frequency).toBeCloseTo(frequency, 1);
      expect(pitch?.clarity).toBeGreaterThan(0.99);
    }
  });

  it.each(STANDARD_TUNING)(
    'reads the fundamental of string $number under louder harmonics as it decays',
    ({ frequency }) => {
      for (const sampleRate of SAMPLE_RATES) {
        const samples = tone(frequency, sampleRate, { partials: GUITAR, decay: 6 });
        expect(centsOff(samples, sampleRate, frequency)).toBeLessThan(2);
      }
    }
  );

  it('reads a detuned string as flat of its note', () => {
    const pitch = detectPitch(tone(108, 48_000, { partials: GUITAR }), 48_000);
    const { note, cents } = nearestNote(pitch?.frequency ?? 0);

    expect(noteLabel(note)).toBe('A2');
    expect(Math.round(cents)).toBe(-32);
  });

  it('covers 70 to 400 Hz at every common sample rate', () => {
    for (const sampleRate of [16_000, 22_050, 44_100, 48_000, 96_000]) {
      for (const frequency of [70, 91.3, 233.1, 400]) {
        expect(centsOff(tone(frequency, sampleRate), sampleRate, frequency)).toBeLessThan(1);
      }
    }
  });

  it('ignores a DC offset on the input', () => {
    expect(centsOff(tone(196, 48_000, { offset: 0.4 }), 48_000, 196)).toBeLessThan(1);
  });

  it('hears nothing in silence or below the level gate', () => {
    expect(detectPitch(new Float32Array(4096), 48_000)).toBeNull();
    expect(detectPitch(tone(110, 48_000, { level: 0.001 }), 48_000)).toBeNull();
  });

  it('hears nothing in white noise', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      expect(detectPitch(whiteNoise(4096, 0.5, seed), 48_000)).toBeNull();
    }
  });

  it('hears nothing in a block too short to hold two periods of the lowest note', () => {
    expect(detectPitch(tone(110, 48_000).slice(0, 512), 48_000)).toBeNull();
  });
});

describe('analysisWindowSize', () => {
  it('spans at least 80 ms in a power of two', () => {
    expect(analysisWindowSize(16_000)).toBe(2048);
    expect(analysisWindowSize(44_100)).toBe(4096);
    expect(analysisWindowSize(48_000)).toBe(4096);
    expect(analysisWindowSize(96_000)).toBe(8192);
  });
});

const feed = (track: PitchTrack, detected: number | null, frames: number): PitchTrack => {
  let next = track;
  for (let frame = 0; frame < frames; frame += 1) next = trackPitch(next, detected);
  return next;
};
const framesUntil = (from: number, to: number): number => {
  let track = trackPitch(EMPTY_TRACK, from);
  let frames = 0;
  while (track.frequency === from && frames < 100) {
    track = trackPitch(track, to);
    frames += 1;
  }
  return frames;
};

describe('trackPitch', () => {
  it('takes the first reading as it is', () => {
    expect(trackPitch(EMPTY_TRACK, 110).frequency).toBe(110);
  });

  it('eases towards a nearby reading instead of jumping to it', () => {
    const held = trackPitch(EMPTY_TRACK, 110);
    const eased = trackPitch(held, 111).frequency ?? 0;

    expect(eased).toBeGreaterThan(110);
    expect(eased).toBeLessThan(111);
    expect(feed(held, 111, 30).frequency).toBeCloseTo(111, 2);
  });

  it('ignores a passing octave misread', () => {
    const held = trackPitch(EMPTY_TRACK, 82.41);
    const blipped = feed(held, 164.82, 3);

    expect(blipped.frequency).toBe(82.41);
    expect(trackPitch(blipped, 82.41).strays).toBe(0);
  });

  it('follows a change of string, and an octave only once it lasts longer', () => {
    const stringChange = framesUntil(110, 146.83);
    const octave = framesUntil(110, 220);

    expect(stringChange).toBeGreaterThan(1);
    expect(octave).toBeGreaterThan(stringChange);
    expect(octave).toBeLessThan(100);
  });

  it('holds the reading through a short dropout, then lets it go', () => {
    const held = trackPitch(EMPTY_TRACK, 110);

    expect(feed(held, null, 3).frequency).toBe(110);
    expect(feed(held, null, 60).frequency).toBeNull();
  });
});
