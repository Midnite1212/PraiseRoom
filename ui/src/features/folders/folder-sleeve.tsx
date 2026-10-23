import { Vinyl } from '@/components/primitives/vinyl';
import { cn } from '@/lib/utils';

const CELL_CLASSES = { a: 'bg-brand', w: 'bg-cover-light', g: 'bg-cover-dim', '': '' } as const;
type Cell = keyof typeof CELL_CLASSES;

const hash = (text: string): number => {
  let value = 7;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) >>> 0;
  }
  return value;
};

// A 6×6 mirrored pixel pattern seeded by the folder, so every folder keeps its own cover.
export const coverCells = (seed: string): Cell[] => {
  let value = hash(seed);
  const cells: Cell[] = [];
  for (let row = 0; row < 6; row += 1) {
    const half: Cell[] = [];
    for (let column = 0; column < 3; column += 1) {
      value = (value * 1103515245 + 12345) >>> 0;
      const pick = (value >>> 16) % 20;
      half.push(pick < 3 ? 'a' : pick < 5 ? 'w' : pick < 10 ? 'g' : '');
    }
    cells.push(...half, ...half.toReversed());
  }
  return cells;
};

const SLEEVE_SIZES = {
  row: 'w-12 mr-2 [&_[data-cover]]:rounded-lg',
  hero: 'w-24 mr-4 wide:w-[152px] wide:mr-[26px]',
  card: 'w-auto mr-[14%]',
} as const;

// A folder as a record sleeve with pixel cover art, its record peeking out (and sliding out further when a
// `sleeve-host` ancestor is hovered).
export function FolderSleeve({
  folderId,
  name,
  size,
}: {
  folderId: string;
  name: string;
  size: keyof typeof SLEEVE_SIZES;
}) {
  return (
    <span aria-hidden className={cn('relative block aspect-square flex-none', SLEEVE_SIZES[size])}>
      <Vinyl size="fill" className="sleeve-vinyl" />
      <span
        data-cover
        className="sleeve-cover relative z-[1] grid size-full grid-cols-6 overflow-hidden rounded-[14px] bg-cover"
      >
        {coverCells(folderId + name).map((cell, index) => (
          // The cover is a fixed 6×6 grid; a cell's place is its identity.
          // oxlint-disable-next-line react/no-array-index-key
          <i key={index} className={cn('block', CELL_CLASSES[cell])} />
        ))}
      </span>
    </span>
  );
}
