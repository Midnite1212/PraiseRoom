import { brandLogoUrl, useAccent } from '@/lib/accent';
import { cn } from '@/lib/utils';

// The Praise Room logo, in the accent colour chosen on this device.
export function BrandMark({ className }: { className?: string }) {
  const [accent] = useAccent();
  return (
    <img
      src={brandLogoUrl(accent)}
      alt=""
      width={200}
      height={200}
      draggable={false}
      className={cn('size-8 flex-none select-none', className)}
    />
  );
}
