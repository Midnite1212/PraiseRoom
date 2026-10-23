import { describe, expect, it } from 'vitest';

import { coverCells } from './folder-sleeve';

describe('coverCells', () => {
  it('draws the same mirrored 6×6 cover for the same folder', () => {
    const cells = coverCells('folder-1Care group');
    expect(cells).toHaveLength(36);
    expect(coverCells('folder-1Care group')).toEqual(cells);
    for (let row = 0; row < 6; row += 1) {
      const line = cells.slice(row * 6, row * 6 + 6);
      expect(line).toEqual(line.toReversed());
    }
  });

  it('draws different covers for different folders', () => {
    expect(coverCells('folder-1Care group')).not.toEqual(coverCells('folder-2Youth night'));
  });
});
