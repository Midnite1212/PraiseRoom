import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

// Phones: the page's one primary action, an ink circle floating above the tab dock on the right.
// Wide screens use the labelled button in the page header instead.
export function Fab({
  asChild = false,
  className,
  ...props
}: ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      className={cn(
        'bg-primary text-primary-foreground fab-shadow fixed right-[max(16px,env(safe-area-inset-right))] bottom-[calc(var(--bottom)+var(--tab-h)+12px)] z-30 grid size-14 place-items-center rounded-full transition-transform duration-[260ms] ease-liquid active:scale-95 wide:hidden [&_svg]:size-icon',
        className
      )}
      {...props}
    />
  );
}
