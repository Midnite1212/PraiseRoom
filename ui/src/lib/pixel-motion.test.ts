import { describe, expect, it } from 'vitest';

import {
  at,
  bars,
  buildStrip,
  cellsToPath,
  GRID,
  MAX_FRAMES,
  nudge,
  partsOf,
  rasterize,
  ripple,
  wave,
  type Cells,
} from './pixel-motion';

const CHART =
  'M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zM7 11h2v6H7zm4-4h2v10h-2zm4 6h2v4h-2z';
const TWO_DOTS = 'M2 2h2v2H2zm6 0h2v2H8z';

const draw = (cells: Cells, rows: [number, number]) =>
  Array.from({ length: rows[1] - rows[0] + 1 }, (_row, i) =>
    Array.from({ length: 12 }, (_, x) => (cells.has(at(x, rows[0] + i)) ? '#' : '.')).join('')
  );

describe('rasterize', () => {
  it('fills the cells a path covers, following relative moves after a close', () => {
    expect(draw(rasterize([TWO_DOTS]), [1, 4])).toEqual([
      '............',
      '..##....##..',
      '..##....##..',
      '............',
    ]);
  });

  it('reads polygons drawn with absolute lines and implicit closes', () => {
    expect(draw(rasterize(['M2 2H6V4L4 4L4 6H2']), [1, 6])).toEqual([
      '............',
      '..####......',
      '..####......',
      '..##........',
      '..##........',
      '............',
    ]);
  });

  it('merges every path of a multi-path icon', () => {
    expect(rasterize(['M0 0h1v1H0z', 'M3 0h1v1H3z'])).toEqual(new Set([at(0, 0), at(3, 0)]));
  });

  it('rejects curves, which pixel icons never use', () => {
    expect(() => rasterize(['M0 0C1 1 2 2 3 3'])).toThrow('Unsupported');
  });
});

describe('cellsToPath', () => {
  it('draws a 2×2 pixel as one rectangle, shifted along the strip', () => {
    expect(cellsToPath(rasterize(['M2 2h2v2H2z']), GRID)).toBe('M26 2h2v2h-2z');
  });

  it('round-trips through rasterize', () => {
    const chart = rasterize([CHART]);
    expect(rasterize([cellsToPath(chart)])).toEqual(chart);
  });
});

describe('partsOf', () => {
  it('splits separate shapes top to bottom, then left to right', () => {
    const parts = partsOf(rasterize([TWO_DOTS, 'M2 8h2v2H2z']));
    expect(parts.map((part) => Math.min(...part))).toEqual([at(2, 2), at(8, 2), at(2, 8)]);
  });

  it('keeps diagonal steps in one shape', () => {
    expect(partsOf(rasterize(['M0 0h2v2H0zm2 2h2v2H2z']))).toHaveLength(1);
  });
});

describe('recipes', () => {
  it('nudge holds the whole icon one pixel over for two frames', () => {
    const [up, hold] = nudge(0, -1).frames(rasterize([TWO_DOTS]));
    expect(up).toEqual(hold);
    expect(draw(up ?? new Set(), [0, 2])).toEqual(['..##....##..', '..##....##..', '............']);
  });

  it('nudge drops cells pushed off the grid', () => {
    const [left] = nudge(-1, 0).frames(rasterize(['M0 0h4v2H0z']));
    expect(left?.size).toBe(4);
  });

  it('ripple moves one shape per frame', () => {
    const icon = rasterize([TWO_DOTS]);
    const frames = ripple(1, 0).frames(icon);
    expect(frames.map((frame) => draw(frame, [2, 2])[0])).toEqual(['....##..##..', '..##......##']);
  });

  it('ripple groups shapes so a busy icon stays within the frame budget', () => {
    const dots = Array.from({ length: 10 }, (_, i) => `M${i * 2} 0h1v1H${i * 2}z`);
    expect(ripple(0, 1).frames(rasterize(dots))).toHaveLength(MAX_FRAMES - 1);
  });

  it('wave lifts one vertical slice per frame, left to right', () => {
    const frames = wave(2).frames(rasterize([TWO_DOTS]));
    expect(frames.map((frame) => draw(frame, [0, 3]))).toEqual([
      ['..##........', '..##........', '........##..', '........##..'],
      ['........##..', '........##..', '..##........', '..##........'],
    ]);
  });

  it('bars raise and drop the bars on their baselines inside the frame', () => {
    const recipe = bars();
    const frames = recipe.frames(rasterize([CHART]));
    expect(recipe.loop).toBe(true);
    expect(frames).toHaveLength(5);
    const tops = frames.map((frame) =>
      [7, 11, 15].map((x) =>
        Array.from({ length: GRID }, (_, y) => y).find((y) => y > 3 && frame.has(at(x, y)))
      )
    );
    expect(tops).toEqual([
      [7, 7, 13],
      [9, 9, 11],
      [11, 7, 9],
      [13, 6, 11],
      [11, 6, 13],
    ]);
    for (const frame of frames) {
      expect([7, 11, 15].every((x) => frame.has(at(x, 16)) && !frame.has(at(x, 17)))).toBe(true);
    }
  });
});

describe('buildStrip', () => {
  it('counts the rest frame and lays the recipe frames after it', () => {
    const strip = buildStrip([TWO_DOTS], ripple(1, 0));
    expect(strip).toEqual({
      frames: 3,
      loop: false,
      d: 'M28 2h2v2h-2zM32 2h2v2h-2zM50 2h2v2h-2zM58 2h2v2h-2z',
    });
  });

  it('refuses a recipe that overflows the CSS frame budget', () => {
    const tooMany = { frames: () => Array.from({ length: MAX_FRAMES }, () => new Set<number>()) };
    expect(() => buildStrip([TWO_DOTS], tooMany)).toThrow('1 to 7 frames');
  });
});
