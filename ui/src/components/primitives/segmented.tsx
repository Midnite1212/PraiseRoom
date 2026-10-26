import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';

import { IconTooltip } from '@/components/primitives/icon-tooltip';
import { cn } from '@/lib/utils';

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
  lang?: string;
};

const OPTION_SIZES = {
  sm: 'h-9 px-2.5 text-[0.8125rem]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-[42px] px-4 text-sm',
  xl: 'h-12 px-[18px] text-sm',
} as const;

type SegmentedProps<T extends string> = {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  size?: keyof typeof OPTION_SIZES;
  mono?: boolean;
  glass?: boolean;
  fullWidth?: boolean;
  optionClassName?: string;
  className?: string;
};

// One choice from a few, with a liquid thumb that slides to the chosen option (`.segmented` in styles.css).
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
  mono = false,
  glass = false,
  fullWidth = false,
  optionClassName,
  className,
}: SegmentedProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        const option = options.find((candidate) => candidate.value === next);
        if (option) onChange(option.value);
      }}
      aria-label={label}
      className={cn(
        'segmented',
        glass && 'glass glass-over bg-transparent',
        fullWidth && 'grid w-full',
        className
      )}
    >
      {options.map((option) => {
        const item = (
          <ToggleGroupPrimitive.Item
            key={option.value}
            value={option.value}
            data-seg-option
            aria-label={option.ariaLabel}
            lang={option.lang}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap text-ink-2 transition-colors duration-200 ease-out hover:text-ink aria-checked:text-ink [&_svg]:size-icon',
              OPTION_SIZES[size],
              mono && 'font-mono',
              optionClassName
            )}
          >
            {option.label}
          </ToggleGroupPrimitive.Item>
        );
        return option.ariaLabel ? (
          <IconTooltip key={option.value} label={option.ariaLabel}>
            {item}
          </IconTooltip>
        ) : (
          item
        );
      })}
      <span aria-hidden className="segmented-thumb" />
    </ToggleGroupPrimitive.Root>
  );
}
