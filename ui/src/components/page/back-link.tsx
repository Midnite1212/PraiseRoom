import { ChevronLeft } from 'pixelarticons/react';
import type { ReactNode } from 'react';

// "‹ Folders" above a detail page on wide screens; phones have the back button in the top bar.
export function BackLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <ChevronLeft />
      {children}
    </>
  );
}

export const BACK_LINK_CLASSES =
  'text-ink-2 hover:liquid-hover hover:text-ink mb-1.5 -ml-2.5 hidden h-9 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-sm font-semibold wide:inline-flex [&_svg]:size-icon';
