import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ReactElement } from 'react';

import { TooltipContent } from '@/components/ui/tooltip';

// Names an icon-only control on hover and keyboard focus. Touch devices never show it, and `open={false}` keeps it
// shut while the control's own popover or menu is open. A disabled control gets no pointer events, so the tooltip
// hangs off a wrapper span instead; the control itself stays disabled and out of the tab order.
export function IconTooltip({
  label,
  disabled = false,
  suppressed = false,
  children,
}: {
  label: string;
  disabled?: boolean;
  suppressed?: boolean;
  children: ReactElement;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={500} skipDelayDuration={200}>
      <TooltipPrimitive.Root open={suppressed ? false : undefined}>
        <TooltipPrimitive.Trigger asChild>
          {disabled ? <span className="inline-flex">{children}</span> : children}
        </TooltipPrimitive.Trigger>
        <TooltipContent className="pointer-coarse:hidden" sideOffset={6}>
          {label}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
