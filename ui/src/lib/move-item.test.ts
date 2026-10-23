import { describe, expect, it } from 'vitest';

import { moveItem } from './move-item';

describe('moveItem', () => {
  it('moves items without mutating the input and ignores moves off the ends', () => {
    const items = ['a', 'b', 'c'];
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(items, 2, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(items, 0, -1)).toEqual(items);
    expect(items).toEqual(['a', 'b', 'c']);
  });
});
