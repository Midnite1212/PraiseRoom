import { describe, expect, it } from 'vitest';

import { toSafeRedirect } from './safe-redirect';

describe('toSafeRedirect', () => {
  it.each([
    ['/songs?q=grace', '/songs?q=grace'],
    ['/', '/'],
    ['//evil.example', '/'],
    ['https://evil.example', '/'],
    ['songs', '/'],
    [undefined, '/'],
    [42, '/'],
  ])('maps %p to %p', (value, expected) => {
    expect(toSafeRedirect(value)).toBe(expected);
  });
});
