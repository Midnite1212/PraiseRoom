import { cn } from '@/lib/utils';

// The Praise Room mark until a logo exists: a pixel room (roof, walls, floor) with a cross of light inside.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={cn('size-[18px] flex-none', className)}
    >
      <rect x="5" y="0" width="2" height="1" />
      <rect x="4" y="1" width="1" height="1" />
      <rect x="7" y="1" width="1" height="1" />
      <rect x="3" y="2" width="1" height="1" />
      <rect x="8" y="2" width="1" height="1" />
      <rect x="1" y="3" width="2" height="1" />
      <rect x="9" y="3" width="2" height="1" />
      <rect x="2" y="4" width="1" height="8" />
      <rect x="9" y="4" width="1" height="8" />
      <rect x="3" y="11" width="6" height="1" />
      <rect x="5" y="4" width="2" height="7" className="fill-brand" />
      <rect x="3" y="6" width="6" height="2" className="fill-brand" />
    </svg>
  );
}
