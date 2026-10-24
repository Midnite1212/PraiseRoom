import { Vinyl } from '@/components/primitives/vinyl';
import { cn } from '@/lib/utils';

import { type FolderCover, GLYPH_SIZE } from './folder-cover';

const SLEEVE_SIZES = {
  pick: 'w-9 mr-1.5 [&_[data-cover]]:rounded-md',
  row: 'w-12 mr-2 [&_[data-cover]]:rounded-lg',
  hero: 'w-24 mr-4 wide:w-[152px] wide:mr-[26px]',
  pane: 'w-24 mr-4 wide:w-[120px] wide:mr-5',
  card: 'w-auto mr-[14%]',
} as const;

// A folder as a record sleeve with its pixel glyph on the cover, its record peeking out (and sliding out
// further when a `sleeve-host` ancestor is hovered).
export function FolderSleeve({
  cover,
  size,
}: {
  cover: FolderCover;
  size: keyof typeof SLEEVE_SIZES;
}) {
  const lit = cover.glyph.flatMap((on, index) => (on ? [index] : []));
  return (
    <span aria-hidden className={cn('relative block aspect-square flex-none', SLEEVE_SIZES[size])}>
      <Vinyl size="fill" className="sleeve-vinyl" />
      <span
        data-cover
        data-cover-hue={cover.hue}
        className="sleeve-cover bg-cover-tint text-cover-ink relative z-[1] block size-full overflow-hidden rounded-[14px]"
      >
        <svg
          viewBox={`-1 -1 ${GLYPH_SIZE + 2} ${GLYPH_SIZE + 2}`}
          shapeRendering="crispEdges"
          className="block size-full fill-current"
        >
          {lit.map((cell) => (
            <rect
              key={cell}
              x={cell % GLYPH_SIZE}
              y={Math.floor(cell / GLYPH_SIZE)}
              width={1}
              height={1}
            />
          ))}
        </svg>
      </span>
    </span>
  );
}
