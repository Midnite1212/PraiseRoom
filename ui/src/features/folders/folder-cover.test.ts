import { describe, expect, it } from 'vitest';

import { coverCells, nextFolderDate } from './folder-cover';

const NOW = new Date(2026, 9, 24).getTime();
const day = (offset: number) => new Date(2026, 9, 24 + offset).toISOString();
const setlist = (id: string, songs: number, date: string | null) => ({
  _id: id,
  date,
  songs: Array.from({ length: songs }, (_, index) => ({
    _id: `${id}-${index}`,
    title: `Song ${index}`,
  })),
});

const column = (cells: readonly string[], index: number) =>
  Array.from({ length: 6 }, (_, row) => cells[row * 6 + index]);

describe('coverCells', () => {
  it('draws an empty 6×6 grid for a folder without setlists', () => {
    const cells = coverCells([], null, NOW);
    expect(cells).toHaveLength(36);
    expect(cells.every((cell) => cell === '')).toBe(true);
  });

  it('stacks one pixel per song from the floor in a 2-wide column', () => {
    const cells = coverCells([setlist('a', 3, day(-7))], null, NOW);
    expect(column(cells, 2)).toEqual(['', '', '', 'w', 'w', 'w']);
    expect(column(cells, 3)).toEqual(column(cells, 2));
    expect(column(cells, 1)).toEqual(Array(6).fill(''));
  });

  it('caps a column at six pixels', () => {
    const cells = coverCells([setlist('a', 9, day(-7))], null, NOW);
    expect(column(cells, 2)).toEqual(Array(6).fill('w'));
  });

  it('colours played, next, upcoming and undated setlists, oldest on the left', () => {
    const cells = coverCells(
      [
        setlist('undated', 1, null),
        setlist('later', 1, day(14)),
        setlist('next', 1, day(2)),
        setlist('played', 1, day(-3)),
      ],
      'next',
      NOW
    );
    const floor = cells.slice(30);
    expect(floor).toEqual(['', 'w', 'a', 'u', 'g', '']);
  });

  it.each([
    [1, [2, 3]],
    [2, [0, 1, 3, 4]],
    [3, [0, 2, 4]],
    [4, [1, 2, 3, 4]],
    [6, [0, 1, 2, 3, 4, 5]],
  ])('lays %i setlist(s) out in the columns the mock does', (count, lit) => {
    const sets = Array.from({ length: count }, (_, index) =>
      setlist(`s${index}`, 6, day(-30 + index))
    );
    const cells = coverCells(sets, null, NOW);
    const litColumns = Array.from({ length: 6 }, (_, index) => index).filter(
      (index) => column(cells, index)[0] === 'w'
    );
    expect(litColumns).toEqual(lit);
    expect(cells.filter((cell) => cell !== '')).toHaveLength(lit.length * 6);
  });

  it('keeps only the latest six setlists', () => {
    const many = Array.from({ length: 8 }, (_, index) => setlist(`s${index}`, 1, day(-20 + index)));
    const floor = coverCells(many, null, NOW).slice(30);
    expect(floor).toEqual(Array(6).fill('w'));
  });
});

describe('nextFolderDate', () => {
  it('returns the soonest date today or later', () => {
    const date = nextFolderDate(
      [setlist('a', 1, day(9)), setlist('b', 1, day(3)), setlist('c', 1, day(-2))],
      NOW
    );
    expect(date).toBe(day(3));
  });

  it('returns null without an upcoming setlist', () => {
    expect(nextFolderDate([setlist('a', 1, day(-1)), setlist('b', 1, null)], NOW)).toBeNull();
  });
});
