import { brandLogoUrl, useAccent } from '@/lib/accent';
import { cn } from '@/lib/utils';

// The Praise Room logo, in the accent colour chosen on this device. It takes a 28px box; the image
// carries its own glow, so it draws larger and spills into the margin.
export function BrandMark({ className }: { className?: string }) {
  const [accent] = useAccent();
  return (
    <img
      src={brandLogoUrl(accent)}
      alt=""
      width={200}
      height={200}
      draggable={false}
      className={cn(
        '-m-1.5 size-10 flex-none select-none drop-shadow-[0_2px_6px_color-mix(in_oklch,var(--brand)_45%,transparent)]',
        className
      )}
    />
  );
}
