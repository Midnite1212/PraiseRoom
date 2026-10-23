import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Toggle as TogglePrimitive } from 'radix-ui';
import * as React from 'react';

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap text-ink-2 transition-colors duration-200 ease-out outline-none hover:bg-fill-press hover:text-ink disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-fill-on aria-pressed:text-ink data-[state=on]:bg-fill-on data-[state=on]:text-ink [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'bg-fill-hover',
      },
      size: {
        default: 'h-9 min-w-9 px-3.5',
        sm: 'h-8 min-w-8 px-3 text-[0.8125rem]',
        lg: 'h-11 min-w-11 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Toggle({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
