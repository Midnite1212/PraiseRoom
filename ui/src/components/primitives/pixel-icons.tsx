import type { ComponentProps } from 'react';

function PixelIcon({ d, ...props }: ComponentProps<'svg'> & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden {...props}>
      <path d={d} />
    </svg>
  );
}

// A key, ring on the left and two teeth, drawn on the pixelarticons grid.
export function KeyIcon(props: ComponentProps<'svg'>) {
  return (
    <PixelIcon
      d="M4 7h5v2H4zM2 9h2v6H2zm7 0h2v6H9zM4 15h5v2H4zm7-4h11v2H11zm7 2h2v4h-2zm-4 0h2v3h-2z"
      {...props}
    />
  );
}

// A phone with a home button.
export function PhoneIcon(props: ComponentProps<'svg'>) {
  return (
    <PixelIcon d="M7 2h10v2H7zM5 4h2v16H5zm12 0h2v16h-2zM7 20h10v2H7zm4-4h2v2h-2z" {...props} />
  );
}

// A minus in a ring: removes an item from a list while the item itself lives on.
export function RemoveIcon(props: ComponentProps<'svg'>) {
  return (
    <PixelIcon
      d="M8 2h8v2H8zM6 4h2v2H6zm10 0h2v2h-2zM4 6h2v2H4zm14 0h2v2h-2zM2 8h2v8H2zm18 0h2v8h-2zM4 16h2v2H4zm14 0h2v2h-2zM6 18h2v2H6zm10 0h2v2h-2zM8 20h8v2H8zM7 11h10v2H7z"
      {...props}
    />
  );
}
