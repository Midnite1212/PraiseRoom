import { Vinyl } from '@/components/primitives/vinyl';
import { cn } from '@/lib/utils';

import { CELL_CLASSES, type Cell } from './folder-cover';

const SLEEVE_SIZES = {
  row: 'w-12 mr-2 [&_[data-cover]]:rounded-lg',
  hero: 'w-24 mr-4 wide:w-[152px] wide:mr-[26px]',
  card: 'w-auto mr-[14%]',
} as const;

// A folder as a record sleeve with pixel cover art, its record peeking out (and sliding out further when a
// `sleeve-host` ancestor is hovered).
export function FolderSleeve({
  cells,
  size,
}: {
  cells: readonly Cell[];
  size: keyof typeof SLEEVE_SIZES;
}) {
  return (
    <span aria-hidden className={cn('relative block aspect-square flex-none', SLEEVE_SIZES[size])}>
      <Vinyl size="fill" className="sleeve-vinyl" />
      <span
        data-cover
        className="sleeve-cover relative z-[1] grid size-full grid-cols-6 overflow-hidden rounded-[14px] bg-cover"
      >
        {cells.map((cell, index) => (
          // The cover is a fixed 6×6 grid; a cell's place is its identity.
          // oxlint-disable-next-line react/no-array-index-key
          <i key={index} className={cn('block', CELL_CLASSES[cell])} />
        ))}
      </span>
    </span>
  );
}
