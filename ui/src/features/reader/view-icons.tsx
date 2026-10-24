import type { ComponentProps } from 'react';

function PixelIcon({ d, ...props }: ComponentProps<'svg'> & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden {...props}>
      <path d={d} />
    </svg>
  );
}

// One framed panel, in the pixelarticons grid.
export function ViewOneIcon(props: ComponentProps<'svg'>) {
  return <PixelIcon d="M5 4h14v2H5zm0 14h14v2H5zM5 6h2v12H5zm12 0h2v12h-2z" {...props} />;
}

// Two framed panels side by side.
export function ViewSplitIcon(props: ComponentProps<'svg'>) {
  return (
    <PixelIcon
      d="M2 4h9v2H2zm0 14h9v2H2zM2 6h2v12H2zm7 0h2v12H9zm4-2h9v2h-9zm0 14h9v2h-9zm0-12h2v12h-2zm7 0h2v12h-2z"
      {...props}
    />
  );
}
