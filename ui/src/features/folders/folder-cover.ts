import { nextSetlistId, setStatus, type SetStatus } from '@/components/primitives/set-status';
import type { SetlistSummary } from '@/features/setlists/api';

export const CELL_CLASSES = {
  a: 'bg-brand',
  w: 'bg-cover-light',
  u: 'bg-cover-soft',
  g: 'bg-cover-dim',
  '': '',
} as const;

export type Cell = keyof typeof CELL_CLASSES;

const SIZE = 6;
const STATUS_CELLS: Record<SetStatus, Cell> = { next: 'a', past: 'w', up: 'u', undated: 'g' };

// Column width and gap that fit n columns in the grid, widest first.
const columnLayout = (count: number): { width: number; gap: number } => {
  for (const [width, gap] of [
    [2, 1],
    [1, 1],
    [1, 0],
  ] as const) {
    if (count * width + (count - 1) * gap <= SIZE) return { width, gap };
  }
  return { width: 1, gap: 0 };
};

type CoverSetlist = Pick<SetlistSummary, '_id' | 'date' | 'songs'>;

const timeOf = (setlist: CoverSetlist): number => {
  const time = setlist.date ? new Date(setlist.date).getTime() : Number.NaN;
  return Number.isNaN(time) ? Infinity : time;
};

// An equaliser of the folder's latest setlists: one column each, oldest on the left, one pixel per song
// stacked from the floor. `nextId` is the soonest upcoming setlist across everything the user can see.
export const coverCells = (
  setlists: readonly CoverSetlist[],
  nextId: string | null,
  now: number
): Cell[] => {
  const columns = setlists.toSorted((a, b) => timeOf(a) - timeOf(b)).slice(-SIZE);
  const { width, gap } = columnLayout(columns.length);
  const offset = Math.floor((SIZE - (columns.length * width + (columns.length - 1) * gap)) / 2);
  const cells: Cell[] = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      const relative = column - offset;
      const setlist =
        relative >= 0 && relative % (width + gap) < width
          ? columns[Math.floor(relative / (width + gap))]
          : undefined;
      const lit = setlist !== undefined && SIZE - row <= Math.min(SIZE, setlist.songs.length);
      cells.push(lit ? STATUS_CELLS[setStatus(setlist, nextId, now)] : '');
    }
  }
  return cells;
};

// The folder's soonest setlist dated today or later.
export const nextFolderDate = (setlists: readonly CoverSetlist[], now: number): string | null => {
  const nextId = nextSetlistId(setlists, now);
  return setlists.find(({ _id }) => _id === nextId)?.date ?? null;
};
