export const MIN_BPM = 30;
export const MAX_BPM = 240;
export const FIRST_BPM = 72;

export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '6/8'] as const;
export type TimeSignature = (typeof TIME_SIGNATURES)[number];

const BEATS_PER_BAR: Record<TimeSignature, number> = { '2/4': 2, '3/4': 3, '4/4': 4, '6/8': 6 };

export type Accent = 'strong' | 'medium' | 'weak';

export type Beat = { time: number; beat: number };

export const TAP_RESET_MS = 2000;
const TAPS_KEPT = 5;

export const beatsPerBar = (signature: TimeSignature): number => BEATS_PER_BAR[signature];

// 6/8 is felt as two groups of three, so its fourth beat takes a lighter accent.
export const beatAccent = (beat: number, signature: TimeSignature): Accent => {
  if (beat === 0) return 'strong';
  return signature === '6/8' && beat === 3 ? 'medium' : 'weak';
};

export const clampBpm = (bpm: number): number =>
  Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));

export const secondsPerBeat = (bpm: number): number => 60 / clampBpm(bpm);

// Beats behind `now` are counted, not returned, so a late timer never bursts or shifts the downbeat.
export const planBeats = (
  next: Beat,
  now: number,
  until: number,
  bpm: number,
  signature: TimeSignature
): { beats: Beat[]; next: Beat } => {
  const step = secondsPerBeat(bpm);
  const perBar = beatsPerBar(signature);
  const beats: Beat[] = [];
  let time = next.time;
  let beat = next.beat % perBar;
  while (time < until) {
    if (time >= now) beats.push({ time, beat });
    time += step;
    beat = (beat + 1) % perBar;
  }
  return { beats, next: { time, beat } };
};

export const addTap = (taps: readonly number[], at: number): number[] => {
  const last = taps.at(-1);
  const keep = last !== undefined && at > last && at - last <= TAP_RESET_MS;
  return [...(keep ? taps : []), at].slice(-TAPS_KEPT);
};

export const tapTempo = (taps: readonly number[]): number | null => {
  const first = taps[0];
  const last = taps.at(-1);
  if (taps.length < 2 || first === undefined || last === undefined || last <= first) return null;
  return clampBpm(60_000 / ((last - first) / (taps.length - 1)));
};
