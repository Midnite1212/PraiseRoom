import { describe, expect, it } from 'vitest';

import { initialKey, semitonesToKey } from './key-options';

const key = (label: string) => initialKey(label);

describe('key options', () => {
  it('falls back to C for a key it cannot read', () => {
    expect(initialKey('not a key')).toEqual(initialKey('C'));
    expect(initialKey('Bbm').isMinor).toBe(true);
  });

  it('measures the move between relative majors, so G to Em moves nothing', () => {
    expect(semitonesToKey(key('G'), key('Em'))).toBe(0);
    expect(semitonesToKey(key('C'), key('D'))).toBe(2);
    expect(semitonesToKey(key('Am'), key('Bm'))).toBe(2);
  });
});
