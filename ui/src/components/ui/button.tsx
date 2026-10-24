import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-[background-color,color,transform,opacity] duration-200 ease-out outline-none select-none active:not-disabled:scale-95 disabled:pointer-events-none disabled:opacity-40 aria-invalid:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon",
  {
    variants: {
      variant: {
        // The one filled button: an ink capsule.
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        outline: 'bg-fill-hover text-ink hover:bg-fill-press aria-expanded:bg-fill-press',
        secondary: 'bg-fill-hover text-ink hover:bg-fill-press aria-expanded:bg-fill-press',
        ghost:
          'text-ink hover:bg-fill-hover active:bg-fill-press aria-expanded:bg-fill-hover aria-pressed:bg-fill-on',
        // A floating glass circle or capsule over the page.
        glass:
          'glass glass-over text-ink hover:bg-fill-hover aria-expanded:bg-fill-hover aria-pressed:bg-fill-on',
        destructive: 'bg-danger-tint text-destructive hover:bg-destructive/20',
        // A glass capsule for leaving or deleting: a whisper of red at rest, full red on hover or focus.
        exit: 'glass text-[color-mix(in_oklch,var(--destructive)_45%,var(--ink-2))] [--glass-fill:color-mix(in_oklch,var(--destructive)_5%,var(--glass-tint))] hover:text-destructive focus-visible:text-destructive hover:[--glass-fill:color-mix(in_oklch,var(--destructive)_22%,var(--glass-tint))] focus-visible:[--glass-fill:color-mix(in_oklch,var(--destructive)_22%,var(--glass-tint))] hover:[&_svg]:drop-shadow-[0_0_3px_color-mix(in_oklch,var(--destructive)_70%,transparent)]',
        'destructive-solid': 'bg-destructive text-white hover:opacity-90',
        link: 'rounded-[10px] text-chord hover:bg-fill-hover',
      },
      size: {
        default:
          'wide:h-10 h-11 gap-2 px-[18px] text-ui has-data-[icon=inline-start]:pl-3.5 has-[>svg:first-child]:pl-3.5',
        compact: 'h-9 gap-2 pr-4 pl-3 text-ui',
        xs: 'h-7 gap-1 px-2.5 text-xs',
        sm: 'h-9 gap-1.5 px-3 text-sm',
        lg: 'h-12 gap-2 px-5 text-base',
        icon: 'size-10',
        'icon-xs': 'size-7',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
