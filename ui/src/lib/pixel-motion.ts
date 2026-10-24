export const GRID = 24;
export const MAX_FRAMES = 8;
// pixelarticons draw on the 24-unit grid with 2×2 pixels, so motion moves in steps of 2.
const UNIT = 2;

export type Cells = ReadonlySet<number>;

export type PixelRecipe = {
  frames: (icon: Cells) => Cells[];
  loop?: boolean;
};

export type PixelStrip = { frames: number; loop: boolean; d: string };

type Edge = readonly [number, number, number, number];
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
type Rect = { x: number; y: number; width: number; height: number };

export const at = (x: number, y: number) => y * GRID + x;
const xOf = (cell: number) => cell % GRID;
const yOf = (cell: number) => Math.floor(cell / GRID);
const onGrid = (x: number, y: number) => x >= 0 && x < GRID && y >= 0 && y < GRID;

const TOKEN = /[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g;

function edgesOf(d: string): Edge[] {
  const tokens = d.match(TOKEN) ?? [];
  const edges: Edge[] = [];
  let command = 'M';
  let i = 0;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  const num = () => {
    const value = Number(tokens[i++]);
    if (Number.isNaN(value)) throw new Error(`Unreadable pixel path: ${d}`);
    return value;
  };
  const lineTo = (nextX: number, nextY: number) => {
    edges.push([x, y, nextX, nextY]);
    x = nextX;
    y = nextY;
  };
  const closeSubpath = () => {
    if (x !== startX || y !== startY) edges.push([x, y, startX, startY]);
  };

  while (i < tokens.length) {
    const token = tokens[i] ?? '';
    if (/[a-z]/i.test(token)) {
      command = token;
      i++;
      if (command === 'Z' || command === 'z') {
        closeSubpath();
        x = startX;
        y = startY;
      }
      continue;
    }
    switch (command) {
      case 'M':
      case 'm': {
        closeSubpath();
        const relative = command === 'm';
        x = startX = num() + (relative ? x : 0);
        y = startY = num() + (relative ? y : 0);
        command = relative ? 'l' : 'L';
        break;
      }
      case 'L':
        lineTo(num(), num());
        break;
      case 'l':
        lineTo(x + num(), y + num());
        break;
      case 'H':
        lineTo(num(), y);
        break;
      case 'h':
        lineTo(x + num(), y);
        break;
      case 'V':
        lineTo(x, num());
        break;
      case 'v':
        lineTo(x, y + num());
        break;
      default:
        throw new Error(`Unsupported pixel path command ${command}: ${d}`);
    }
  }
  closeSubpath();
  return edges;
}

// Nonzero winding, the SVG default fill rule.
function isInside(edges: Edge[], px: number, py: number) {
  let winding = 0;
  for (const [x0, y0, x1, y1] of edges) {
    const side = (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0);
    if (y0 <= py) {
      if (y1 > py && side > 0) winding++;
    } else if (y1 <= py && side < 0) {
      winding--;
    }
  }
  return winding !== 0;
}

export function rasterize(paths: readonly string[]): Set<number> {
  const cells = new Set<number>();
  for (const d of paths) {
    const edges = edgesOf(d);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (isInside(edges, x + 0.5, y + 0.5)) cells.add(at(x, y));
      }
    }
  }
  return cells;
}

function runsIn(cells: Cells, y: number): Map<string, Rect> {
  const runs = new Map<string, Rect>();
  let x = 0;
  while (x < GRID) {
    const start = x;
    while (x < GRID && cells.has(at(x, y))) x++;
    if (x > start) runs.set(`${start}:${x}`, { x: start, y, width: x - start, height: 1 });
    else x++;
  }
  return runs;
}

// Runs that repeat on the next row grow into one rectangle, so a 2×2 pixel is a single shape.
export function cellsToPath(cells: Cells, offsetX = 0): string {
  const rects: Rect[] = [];
  let open = new Map<string, Rect>();
  for (let y = 0; y < GRID; y++) {
    const runs = runsIn(cells, y);
    for (const [key, rect] of open) {
      if (runs.has(key)) {
        rect.height++;
        runs.set(key, rect);
      } else {
        rects.push(rect);
      }
    }
    open = runs;
  }
  rects.push(...open.values());
  return rects
    .map(({ x, y, width, height }) => `M${x + offsetX} ${y}h${width}v${height}h${-width}z`)
    .join('');
}

export function buildStrip(paths: readonly string[], recipe: PixelRecipe): PixelStrip {
  const frames = recipe.frames(rasterize(paths));
  if (frames.length === 0 || frames.length >= MAX_FRAMES) {
    throw new Error(`A pixel recipe makes 1 to ${MAX_FRAMES - 1} frames, got ${frames.length}`);
  }
  return {
    frames: frames.length + 1,
    loop: recipe.loop ?? false,
    d: frames.map((cells, i) => cellsToPath(cells, (i + 1) * GRID)).join(''),
  };
}

function boundsOf(cells: Iterable<number>): Bounds {
  const bounds = { minX: GRID, maxX: -1, minY: GRID, maxY: -1 };
  for (const cell of cells) {
    bounds.minX = Math.min(bounds.minX, xOf(cell));
    bounds.maxX = Math.max(bounds.maxX, xOf(cell));
    bounds.minY = Math.min(bounds.minY, yOf(cell));
    bounds.maxY = Math.max(bounds.maxY, yOf(cell));
  }
  return bounds;
}

function move(cells: Cells, dx: number, dy: number, only?: Cells): Set<number> {
  const moved = new Set<number>();
  for (const cell of cells) {
    const shift = !only || only.has(cell);
    const x = xOf(cell) + (shift ? dx : 0);
    const y = yOf(cell) + (shift ? dy : 0);
    if (onGrid(x, y)) moved.add(at(x, y));
  }
  return moved;
}

// 8-connected, so the diagonal steps of pixel art hold a shape together; top to bottom, then left to right.
export function partsOf(cells: Cells): Set<number>[] {
  const seen = new Set<number>();
  const parts: Set<number>[] = [];
  for (const first of cells) {
    if (seen.has(first)) continue;
    const part = new Set<number>([first]);
    const queue = [first];
    seen.add(first);
    while (queue.length > 0) {
      const cell = queue.pop() ?? first;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = xOf(cell) + dx;
          const y = yOf(cell) + dy;
          const next = at(x, y);
          if (!onGrid(x, y) || seen.has(next) || !cells.has(next)) continue;
          seen.add(next);
          part.add(next);
          queue.push(next);
        }
      }
    }
    parts.push(part);
  }
  return parts
    .map((part) => ({ part, bounds: boundsOf(part) }))
    .toSorted((a, b) => a.bounds.minY - b.bounds.minY || a.bounds.minX - b.bounds.minX)
    .map(({ part }) => part);
}

function inGroups(parts: Set<number>[], count: number): Set<number>[] {
  if (parts.length <= count) return parts;
  return Array.from({ length: count }, (_, group) => {
    const from = Math.floor((group * parts.length) / count);
    const to = Math.floor(((group + 1) * parts.length) / count);
    return new Set(parts.slice(from, to).flatMap((part) => Array.from(part)));
  });
}

// The whole icon steps one pixel in a direction and back: (0, -1) is a hop.
export const nudge = (dx: number, dy: number): PixelRecipe => ({
  frames: (icon) => {
    const frame = move(icon, dx * UNIT, dy * UNIT);
    return [frame, frame];
  },
});

// Each shape steps one pixel in turn, top to bottom: list rows slide, separate notes bounce.
export const ripple = (dx: number, dy: number): PixelRecipe => ({
  frames: (icon) =>
    inGroups(partsOf(icon), MAX_FRAMES - 1).map((part) => move(icon, dx * UNIT, dy * UNIT, part)),
});

// Vertical slices lift one pixel in turn, left to right.
export const wave = (slices: number): PixelRecipe => ({
  frames: (icon) => {
    const { minX, maxX } = boundsOf(icon);
    const width = maxX - minX + 1;
    return Array.from({ length: Math.min(slices, MAX_FRAMES - 1) }, (_, slice) => {
      const inSlice = new Set(
        [...icon].filter((cell) => Math.floor(((xOf(cell) - minX) * slices) / width) === slice)
      );
      return move(icon, 0, -UNIT, inSlice);
    });
  },
});

const EQUALISER = [1, 2, 1, 0, -1, 0];
const area = ({ bounds: b }: { bounds: Bounds }) => (b.maxX - b.minX) * (b.maxY - b.minY);

// Bars inside the largest shape (a chart's frame) rise and fall like an equaliser, on their own baselines.
export const bars = (): PixelRecipe => ({
  loop: true,
  frames: (icon) => {
    const parts = partsOf(icon).map((part) => ({ part, bounds: boundsOf(part) }));
    const frame = parts.reduce((largest, part) => (area(part) > area(largest) ? part : largest));
    const ceiling = frame.bounds.minY + 2 * UNIT;
    const barParts = parts
      .filter((part) => part !== frame)
      .toSorted((a, b) => a.bounds.minX - b.bounds.minX);
    return EQUALISER.slice(1).map((_, step) => {
      const cells = new Set(frame.part);
      barParts.forEach(({ bounds }, bar) => {
        const lift = EQUALISER[(step + 1 + bar * 2) % EQUALISER.length] ?? 0;
        const top = Math.min(Math.max(bounds.minY - lift * UNIT, ceiling), bounds.maxY - UNIT + 1);
        for (let y = top; y <= bounds.maxY; y++) {
          for (let x = bounds.minX; x <= bounds.maxX; x++) cells.add(at(x, y));
        }
      });
      return cells;
    });
  },
});
