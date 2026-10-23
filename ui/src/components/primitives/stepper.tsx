import { Minus, Plus } from 'pixelarticons/react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type StepperProps = {
  value: ReactNode;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  canDecrease: boolean;
  canIncrease: boolean;
};

export function Stepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  canDecrease,
  canIncrease,
}: StepperProps) {
  return (
    <span className="flex items-center gap-1">
      <Button
        variant="secondary"
        size="icon"
        aria-label={decreaseLabel}
        disabled={!canDecrease}
        onClick={onDecrease}
      >
        <Minus />
      </Button>
      <output className="min-w-[3.6em] text-center font-mono text-sm font-semibold">{value}</output>
      <Button
        variant="secondary"
        size="icon"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={onIncrease}
      >
        <Plus />
      </Button>
    </span>
  );
}
