import { describe, expect, it } from 'vitest';

import { toggleReaderWidth } from './reader-width';

describe('toggleReaderWidth', () => {
  it('flips between capped and full', () => {
    expect(toggleReaderWidth('capped')).toBe('full');
    expect(toggleReaderWidth('full')).toBe('capped');
  });
});
