import { describe, expect, it } from 'vitest';

import { hasMoreBelow } from './use-more-below';

describe('hasMoreBelow', () => {
  it('is true while content remains below the fold', () => {
    expect(hasMoreBelow({ scrollTop: 0, clientHeight: 300, scrollHeight: 600 })).toBe(true);
  });

  it('is false at the bottom, within a few pixels', () => {
    expect(hasMoreBelow({ scrollTop: 297, clientHeight: 300, scrollHeight: 600 })).toBe(false);
  });

  it('is false when everything fits', () => {
    expect(hasMoreBelow({ scrollTop: 0, clientHeight: 300, scrollHeight: 300 })).toBe(false);
  });
});
