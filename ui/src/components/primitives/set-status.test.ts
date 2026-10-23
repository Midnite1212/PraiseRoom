import { describe, expect, it } from 'vitest';

import { daysFrom, nextSetlistId, setStatus, whenLabel } from './set-status';

const now = new Date(2026, 9, 24, 15, 30).getTime();
const at = (day: number) => new Date(2026, 9, day).toISOString();

const sets = [
  { _id: 'past', date: at(20) },
  { _id: 'later', date: at(31) },
  { _id: 'today', date: at(24) },
  { _id: 'none', date: null },
];

describe('nextSetlistId', () => {
  it('picks the soonest set dated today or later', () => {
    expect(nextSetlistId(sets, now)).toBe('today');
    expect(
      nextSetlistId(
        sets.filter((s) => s._id !== 'today'),
        now
      )
    ).toBe('later');
  });

  it('is null when nothing is upcoming', () => {
    expect(nextSetlistId([{ _id: 'past', date: at(20) }, { _id: 'none' }], now)).toBeNull();
    expect(nextSetlistId([], now)).toBeNull();
  });
});

describe('setStatus', () => {
  it('marks next, up, past and undated', () => {
    expect(setStatus({ _id: 'today', date: at(24) }, 'today', now)).toBe('next');
    expect(setStatus({ _id: 'later', date: at(31) }, 'today', now)).toBe('up');
    expect(setStatus({ _id: 'past', date: at(20) }, 'today', now)).toBe('past');
    expect(setStatus({ _id: 'none', date: null }, 'today', now)).toBe('undated');
    expect(setStatus({ _id: 'bad', date: 'nope' }, 'today', now)).toBe('undated');
  });
});

describe('whenLabel', () => {
  it('counts calendar days, ignoring the time of day', () => {
    expect(daysFrom(at(24), now)).toBe(0);
    expect(daysFrom(at(26), now)).toBe(2);
    expect(daysFrom(at(21), now)).toBe(-3);
  });

  it('reads as today, tomorrow, in N days and N days ago', () => {
    expect(whenLabel(at(24), now, 'en')).toBe('today');
    expect(whenLabel(at(25), now, 'en')).toBe('tomorrow');
    expect(whenLabel(at(29), now, 'en')).toBe('in 5 days');
    expect(whenLabel(at(21), now, 'en')).toBe('3 days ago');
  });
});
