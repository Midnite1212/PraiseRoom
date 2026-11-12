export type Pitch = { frequency: number; clarity: number };

const MIN_FREQUENCY = 60;
const MAX_FREQUENCY = 500;

const ANALYSIS_RATE = 20_000;
const WINDOW_SECONDS = 0.08;
const MIN_LEVEL = 0.005;
const MIN_CLARITY = 0.9;
const PEAK_CUTOFF = 0.93;

const powerOfTwoAtLeast = (value: number): number => 2 ** Math.ceil(Math.log2(value));

export const analysisWindowSize = (sampleRate: number): number =>
  Math.min(32_768, Math.max(2048, powerOfTwoAtLeast(sampleRate * WINDOW_SECONDS)));

// Averages each run of `factor` samples into one and removes the DC offset, which would otherwise
// hide every zero crossing of the autocorrelation.
const condition = (samples: Float32Array, factor: number): Float32Array => {
  const size = Math.floor(samples.length / factor);
  const out = new Float32Array(size);
  let total = 0;
  for (let index = 0; index < size; index += 1) {
    let sum = 0;
    for (let offset = 0; offset < factor; offset += 1) sum += samples[index * factor + offset] ?? 0;
    out[index] = sum / factor;
    total += sum / factor;
  }
  const mean = size > 0 ? total / size : 0;
  for (let index = 0; index < size; index += 1) out[index] = (out[index] ?? 0) - mean;
  return out;
};

const energyOf = (signal: Float32Array): number => {
  let energy = 0;
  for (const sample of signal) energy += sample * sample;
  return energy;
};

// McLeod's normalised square difference: 1 at a lag the signal repeats at, whatever its loudness.
const normalisedDifference = (signal: Float32Array, energy: number, maxLag: number) => {
  const size = signal.length;
  const out = new Float32Array(maxLag + 1);
  let norm = 2 * energy;
  for (let lag = 0; lag <= maxLag; lag += 1) {
    if (lag > 0) {
      const head = signal[lag - 1] ?? 0;
      const tail = signal[size - lag] ?? 0;
      norm -= head * head + tail * tail;
    }
    let correlation = 0;
    for (let index = 0; index < size - lag; index += 1) {
      correlation += (signal[index] ?? 0) * (signal[index + lag] ?? 0);
    }
    out[lag] = norm > 0 ? (2 * correlation) / norm : 0;
  }
  return out;
};

type Peak = { lag: number; value: number };

const refinePeak = (curve: Float32Array, lag: number): Peak => {
  const before = curve[lag - 1] ?? 0;
  const at = curve[lag] ?? 0;
  const after = curve[lag + 1] ?? 0;
  const bend = before - 2 * at + after;
  if (bend >= 0) return { lag, value: at };
  const shift = (0.5 * (before - after)) / bend;
  return { lag: lag + shift, value: at - 0.25 * (before - after) * shift };
};

const keyMaxima = (curve: Float32Array, minLag: number): Peak[] => {
  const last = curve.length - 1;
  const peaks: Peak[] = [];
  let lag = 1;
  while (lag < last && (curve[lag] ?? 0) > 0) lag += 1;
  while (lag < last) {
    while (lag < last && (curve[lag] ?? 0) <= 0) lag += 1;
    let best = lag;
    while (lag < last && (curve[lag] ?? 0) > 0) {
      if ((curve[lag] ?? 0) > (curve[best] ?? 0)) best = lag;
      lag += 1;
    }
    if (best >= minLag && best < last && (curve[best] ?? 0) >= (curve[best + 1] ?? 0)) {
      peaks.push(refinePeak(curve, best));
    }
  }
  return peaks;
};

// The first strong peak wins, so a tone whose harmonics are louder than its fundamental still reads
// as the fundamental. Null for silence, noise and anything outside MIN_FREQUENCY to MAX_FREQUENCY.
export const detectPitch = (samples: Float32Array, sampleRate: number): Pitch | null => {
  const factor = Math.max(1, Math.floor(sampleRate / ANALYSIS_RATE));
  const rate = sampleRate / factor;
  const signal = condition(samples, factor);
  const maxLag = Math.ceil(rate / MIN_FREQUENCY) + 1;
  if (signal.length < 2 * maxLag) return null;

  const energy = energyOf(signal);
  if (Math.sqrt(energy / signal.length) < MIN_LEVEL) return null;

  const curve = normalisedDifference(signal, energy, maxLag);
  const peaks = keyMaxima(curve, Math.floor(rate / MAX_FREQUENCY));
  const highest = Math.max(0, ...peaks.map((peak) => peak.value));
  const peak = peaks.find((candidate) => candidate.value >= PEAK_CUTOFF * highest);
  if (!peak || peak.value < MIN_CLARITY) return null;
  return { frequency: rate / peak.lag, clarity: Math.min(1, peak.value) };
};

export type PitchTrack = { frequency: number | null; strays: number; quiet: number };

export const EMPTY_TRACK: PitchTrack = { frequency: null, strays: 0, quiet: 0 };

const SMOOTHING = 0.3;
const STEADY_CENTS = 60;
const OCTAVE_SLACK_CENTS = 60;
const JUMP_FRAMES = 4;
const OCTAVE_FRAMES = 10;
const HOLD_FRAMES = 12;

// A jump has to repeat before it is believed, an octave jump longest, since that is how a decaying
// string misreads; a short dropout keeps the last reading.
export const trackPitch = (track: PitchTrack, detected: number | null): PitchTrack => {
  if (detected === null) {
    const quiet = track.quiet + 1;
    return quiet > HOLD_FRAMES ? EMPTY_TRACK : { ...track, quiet };
  }
  if (track.frequency === null) return { frequency: detected, strays: 0, quiet: 0 };

  const ratio = detected / track.frequency;
  const cents = Math.abs(1200 * Math.log2(ratio));
  if (cents <= STEADY_CENTS) {
    return { frequency: track.frequency * ratio ** SMOOTHING, strays: 0, quiet: 0 };
  }
  const strays = track.strays + 1;
  const needed = Math.abs(cents - 1200) <= OCTAVE_SLACK_CENTS ? OCTAVE_FRAMES : JUMP_FRAMES;
  return strays >= needed
    ? { frequency: detected, strays: 0, quiet: 0 }
    : { frequency: track.frequency, strays, quiet: 0 };
};
