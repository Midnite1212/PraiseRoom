import { describe, expect, it } from 'vitest';

import { SWIPE_MIN_DISTANCE, swipeDirection } from './swipe';

const from = { x: 200, y: 300 };

describe('swipeDirection', () => {
  it('goes to the next song on a clear swipe left', () => {
    expect(swipeDirection(from, { x: 80, y: 310 })).toBe(1);
  });

  it('goes to the previous song on a clear swipe right', () => {
    expect(swipeDirection(from, { x: 320, y: 290 })).toBe(-1);
  });

  it('ignores a drag shorter than the threshold', () => {
    expect(swipeDirection(from, { x: from.x - (SWIPE_MIN_DISTANCE - 1), y: from.y })).toBe(0);
    expect(swipeDirection(from, { x: from.x + (SWIPE_MIN_DISTANCE - 1), y: from.y })).toBe(0);
  });

  it('accepts a drag exactly at the threshold', () => {
    expect(swipeDirection(from, { x: from.x - SWIPE_MIN_DISTANCE, y: from.y })).toBe(1);
  });

  it('ignores vertical scrolling', () => {
    expect(swipeDirection(from, { x: 190, y: 700 })).toBe(0);
  });

  it('ignores a diagonal drag', () => {
    expect(swipeDirection(from, { x: 100, y: 200 })).toBe(0);
    expect(swipeDirection(from, { x: 100, y: 450 })).toBe(0);
  });

  it('ignores a tap', () => {
    expect(swipeDirection(from, from)).toBe(0);
  });
});
