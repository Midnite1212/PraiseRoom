import { describe, expect, it } from 'vitest';

import { COVER_HUES, folderCover, GLYPH_SIZE, nextFolderDate } from './folder-cover';

const NOW = new Date(2026, 9, 24).getTime();
const day = (offset: number) => new Date(2026, 9, 24 + offset).toISOString();
const setlist = (id: string, date: string | null) => ({ _id: id, date });

const ids = Array.from({ length: 40 }, (_, index) => `6a0${index.toString(16).padStart(21, '0')}`);

describe('folderCover', () => {
  it('draws the same cover for the same folder', () => {
    expect(folderCover('6a01c3e9f2b44d7a9e0c1b52')).toEqual(
      folderCover('6a01c3e9f2b44d7a9e0c1b52')
    );
  });

  it.each(ids)('draws a balanced, mirrored 5×5 glyph for %s', (id) => {
    const { glyph } = folderCover(id);
    expect(glyph).toHaveLength(GLYPH_SIZE * GLYPH_SIZE);
    for (let row = 0; row < GLYPH_SIZE; row += 1) {
      const cells = glyph.slice(row * GLYPH_SIZE, (row + 1) * GLYPH_SIZE);
      expect(cells).toEqual(cells.toReversed());
    }
    const lit = glyph.filter(Boolean).length;
    expect(lit).toBeGreaterThanOrEqual(9);
    expect(lit).toBeLessThanOrEqual(16);
    expect(glyph.some((on, index) => on && index % GLYPH_SIZE === 2)).toBe(true);
  });

  it('picks one of the cover hues', () => {
    for (const id of ids) {
      const { hue } = folderCover(id);
      expect(Number.isInteger(hue)).toBe(true);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(COVER_HUES);
    }
  });

  it('tells folders apart', () => {
    const glyphs = new Set(ids.map((id) => folderCover(id).glyph.map(Number).join('')));
    const hues = new Set(ids.map((id) => folderCover(id).hue));
    expect(glyphs.size).toBeGreaterThan(ids.length * 0.9);
    expect(hues.size).toBe(COVER_HUES);
  });
});

describe('nextFolderDate', () => {
  it('returns the soonest date today or later', () => {
    const date = nextFolderDate(
      [setlist('a', day(9)), setlist('b', day(3)), setlist('c', day(-2))],
      NOW
    );
    expect(date).toBe(day(3));
  });

  it('returns null without an upcoming setlist', () => {
    expect(nextFolderDate([setlist('a', day(-1)), setlist('b', null)], NOW)).toBeNull();
  });
});
