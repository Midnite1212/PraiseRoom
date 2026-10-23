import { cn } from '@/lib/utils';

const VINYL_SIZES = {
  sm: '[--v:32px]',
  md: '[--v:44px]',
  lg: '[--v:56px]',
  // Sized by its host (a folder sleeve).
  fill: '',
} as const;

type VinylProps = {
  initial?: string;
  size?: keyof typeof VINYL_SIZES;
  spinning?: boolean;
  className?: string;
};

// A record: your profile (with your initial on the label) or a folder's disc peeking out of its sleeve.
// Inside a `group/vinyl` host it turns while the host is hovered or its menu is open.
export function Vinyl({ initial, size = 'md', spinning = false, className }: VinylProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'vinyl group-hover/vinyl:animate-spin-slow group-aria-expanded/vinyl:animate-spin-slow group-active/vinyl:scale-95',
        VINYL_SIZES[size],
        spinning && 'animate-spin-slow',
        className
      )}
    >
      {initial ? <span className="vinyl-label">{initial}</span> : null}
    </span>
  );
}
