import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { IconTooltip } from '@/components/primitives/icon-tooltip';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-[background-color,color,transform,opacity] duration-200 ease-out outline-none select-none active:not-disabled:scale-95 disabled:pointer-events-none disabled:opacity-40 aria-invalid:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon",
  {
    variants: {
      variant: {
        // The one filled button: an ink capsule.
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        outline: 'lit-icon bg-fill-hover text-ink hover:bg-fill-press aria-expanded:bg-fill-press',
        secondary:
          'lit-icon bg-fill-hover text-ink hover:bg-fill-press aria-expanded:bg-fill-press',
        ghost:
          'lit-icon text-ink hover:liquid-hover active:bg-fill-press aria-expanded:bg-fill-hover aria-pressed:liquid-on',
        // A floating glass circle or capsule over the page.
        glass:
          'lit-icon glass glass-over text-ink hover:bg-fill-hover aria-expanded:bg-fill-hover aria-pressed:bg-fill-on',
        destructive: 'bg-danger-tint text-destructive hover:bg-destructive/20',
        // A glass capsule for leaving or deleting: a whisper of red at rest, full red on hover or focus.
        exit: 'lit-icon-danger glass text-danger-quiet [--glass-fill:color-mix(in_oklch,var(--destructive)_5%,var(--glass-tint))] hover:text-destructive focus-visible:text-destructive hover:[--glass-fill:color-mix(in_oklch,var(--destructive)_22%,var(--glass-tint))] focus-visible:[--glass-fill:color-mix(in_oklch,var(--destructive)_22%,var(--glass-tint))]',
        'destructive-solid': 'bg-destructive text-white hover:opacity-90',
        link: 'lit-icon rounded-[10px] text-chord hover:liquid-hover',
      },
      size: {
        default:
          'wide:h-10 h-11 gap-2 px-[18px] text-ui has-data-[icon=inline-start]:pl-3.5 has-[>svg:first-child]:pl-3.5',
        compact: 'h-9 gap-2 pr-4 pl-3 text-ui',
        xs: 'h-7 gap-1 px-2.5 text-xs',
        sm: 'h-9 gap-1.5 px-3 text-sm',
        lg: 'h-12 gap-2 px-5 text-base',
        icon: 'wide:size-10 size-11',
        'icon-xs': 'size-7',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
        dock: 'h-14 w-[52px]',
        'dock-step': 'h-11 w-10',
      },
    },
    compoundVariants: [
      { variant: 'glass', size: 'icon', className: 'size-10' },
      { variant: 'link', size: 'sm', className: 'wide:my-0 wide:h-9 -my-1 h-11' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const ICON_SIZES = new Set(['icon', 'icon-xs', 'icon-sm', 'icon-lg']);

// Praise Room: an icon-only button names itself in a tooltip (from its aria-label) on hover and keyboard focus.
// Touch devices never show it, and it stays closed while the button's own popover or menu is open.
function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  tooltip = true,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    tooltip?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';
  const label = props['aria-label'];
  const hasTooltip = tooltip && size !== null && ICON_SIZES.has(size) && typeof label === 'string';

  const button = (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      title={hasTooltip ? undefined : props.title}
    />
  );
  if (!hasTooltip) return button;

  return (
    <IconTooltip
      label={label}
      disabled={props.disabled === true}
      suppressed={String(props['aria-expanded']) === 'true'}
    >
      {button}
    </IconTooltip>
  );
}

export { Button, buttonVariants };
