import { describe, expect, it } from 'vitest';

import {
  addTap,
  beatAccent,
  clampBpm,
  MAX_BPM,
  MIN_BPM,
  planBeats,
  secondsPerBeat,
  TAP_RESET_MS,
  tapTempo,
  type TimeSignature,
} from './tempo';

const times = (beats: { time: number }[]) => beats.map(({ time }) => Number(time.toFixed(6)));

describe('planBeats', () => {
  it('spaces beats by the tempo and stops at the look-ahead edge', () => {
    const { beats, next } = planBeats({ time: 1, beat: 0 }, 1, 3, 120, '4/4');

    expect(times(beats)).toEqual([1, 1.5, 2, 2.5]);
    expect(beats.map(({ beat }) => beat)).toEqual([0, 1, 2, 3]);
    expect(next).toEqual({ time: 3, beat: 0 });
  });

  it.each<[TimeSignature, number[]]>([
    ['2/4', [0, 1, 0, 1, 0, 1]],
    ['3/4', [0, 1, 2, 0, 1, 2]],
    ['4/4', [0, 1, 2, 3, 0, 1]],
    ['6/8', [0, 1, 2, 3, 4, 5]],
  ])('counts the bar in %s', (signature, bar) => {
    const { beats } = planBeats({ time: 0, beat: 0 }, 0, 6, 60, signature);
    expect(beats.map(({ beat }) => beat)).toEqual(bar);
  });

  it('carries on from where the last plan stopped', () => {
    const first = planBeats({ time: 0, beat: 0 }, 0, 0.1, 90, '3/4');
    const second = planBeats(first.next, 0.05, 1.5, 90, '3/4');

    expect(times(first.beats)).toEqual([0]);
    expect(times(second.beats)).toEqual([0.666667, 1.333333]);
    expect(second.beats.map(({ beat }) => beat)).toEqual([1, 2]);
  });

  it('drops beats a late timer missed but keeps the downbeat in place', () => {
    const { beats, next } = planBeats({ time: 0, beat: 0 }, 1.2, 1.6, 120, '4/4');

    expect(times(beats)).toEqual([1.5]);
    expect(beats[0]?.beat).toBe(3);
    expect(next).toEqual({ time: 2, beat: 0 });
  });

  it('plans nothing before the next beat is due', () => {
    expect(planBeats({ time: 2, beat: 1 }, 1, 1.1, 120, '4/4').beats).toEqual([]);
  });

  it('wraps a beat that is past the end of a shorter bar', () => {
    expect(planBeats({ time: 0, beat: 3 }, 0, 0.1, 120, '3/4').beats).toEqual([
      { time: 0, beat: 0 },
    ]);
  });

  it('keeps every gap equal over a long run', () => {
    const { beats } = planBeats({ time: 0, beat: 0 }, 0, 59.9, 97, '4/4');
    const gaps = beats.slice(1).map((beat, index) => beat.time - (beats[index]?.time ?? 0));

    expect(beats).toHaveLength(97);
    for (const gap of gaps) expect(gap).toBeCloseTo(60 / 97, 9);
  });
});

describe('beatAccent', () => {
  it('accents the first beat of every bar', () => {
    expect([0, 1, 2, 3].map((beat) => beatAccent(beat, '4/4'))).toEqual([
      'strong',
      'weak',
      'weak',
      'weak',
    ]);
    expect(beatAccent(0, '2/4')).toBe('strong');
    expect(beatAccent(0, '3/4')).toBe('strong');
  });

  it('gives 6/8 a lighter accent on beat four', () => {
    expect([0, 1, 2, 3, 4, 5].map((beat) => beatAccent(beat, '6/8'))).toEqual([
      'strong',
      'weak',
      'weak',
      'medium',
      'weak',
      'weak',
    ]);
  });
});

describe('tempo limits', () => {
  it('keeps the tempo between 30 and 240 whole beats a minute', () => {
    expect(clampBpm(12)).toBe(MIN_BPM);
    expect(clampBpm(300)).toBe(MAX_BPM);
    expect(clampBpm(99.6)).toBe(100);
    expect(secondsPerBeat(60)).toBe(1);
    expect(secondsPerBeat(1000)).toBe(0.25);
  });
});

const tapAll = (moments: number[]) => moments.reduce<number[]>((taps, at) => addTap(taps, at), []);

describe('tap tempo', () => {
  it('needs two taps for a tempo', () => {
    expect(tapTempo(tapAll([1000]))).toBeNull();
    expect(tapTempo(tapAll([1000, 1500]))).toBe(120);
  });

  it('averages the last few taps', () => {
    expect(tapTempo(tapAll([0, 500, 980, 1500, 2010]))).toBe(119);
    expect(tapAll([0, 500, 1000, 1500, 2000, 2500, 3000])).toEqual([1000, 1500, 2000, 2500, 3000]);
    expect(tapTempo(tapAll([0, 300, 1300, 2300, 3300, 4300, 5300]))).toBe(60);
  });

  it('starts again after a pause', () => {
    const taps = tapAll([0, 500, 1000, 1000 + TAP_RESET_MS + 1]);

    expect(taps).toEqual([1000 + TAP_RESET_MS + 1]);
    expect(tapTempo(taps)).toBeNull();
    expect(tapTempo(addTap(taps, 1000 + TAP_RESET_MS + 401))).toBe(150);
  });

  it('keeps a slow tap that is still within the pause', () => {
    expect(tapTempo(tapAll([0, TAP_RESET_MS]))).toBe(MIN_BPM);
  });

  it('keeps the tempo inside the limits for very fast taps', () => {
    expect(tapTempo(tapAll([0, 100, 200]))).toBe(MAX_BPM);
  });

  it('ignores a tap that does not move forward in time', () => {
    expect(addTap([500], 500)).toEqual([500]);
    expect(addTap([500], 400)).toEqual([400]);
  });
});
