import { cn } from 'cn';
import { Switch as SwitchPrimitive } from 'radix-ui';
import * as React from 'react';

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch relative inline-flex shrink-0 items-center rounded-full p-[3px] transition-colors duration-200 ease-out outline-none after:absolute after:-inset-x-3 after:-inset-y-2 aria-invalid:ring-2 aria-invalid:ring-destructive data-[size=default]:h-7 data-[size=default]:w-[46px] data-[size=sm]:h-5 data-[size=sm]:w-8 data-checked:bg-chord data-unchecked:bg-pixel-off data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-ink ease-liquid data-checked:bg-ground pointer-events-none block rounded-full ring-0 transition-transform duration-[360ms] group-data-[size=default]/switch:size-[22px] group-data-[size=sm]/switch:size-3.5 group-data-[size=default]/switch:data-checked:translate-x-[18px] group-data-[size=sm]/switch:data-checked:translate-x-3 data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
