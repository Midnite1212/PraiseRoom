import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

// Phones: the page's one primary action, an ink circle floating above the tab dock on the right.
// Wide screens use the labelled button in the page header instead. It renders into `body` because
// the page's entrance animation moves its wrapper, and a moving ancestor becomes the containing
// block of a fixed child, which made the button slide in from the top.
export function Fab({
  asChild = false,
  className,
  ...props
}: ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return createPortal(
    <Comp
      className={cn(
        'bg-primary text-primary-foreground fab-shadow fixed right-[max(16px,env(safe-area-inset-right))] bottom-[calc(var(--bottom)+var(--tab-h)+12px)] z-30 grid size-14 place-items-center rounded-full transition-transform duration-[260ms] ease-liquid active:scale-95 wide:hidden [&_svg]:size-icon',
        className
      )}
      {...props}
    />,
    document.body
  );
}
