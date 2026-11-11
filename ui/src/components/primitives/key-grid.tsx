import { keyLabel, type MusicKey } from '@/features/chords/theory';
import { cn } from '@/lib/utils';

type KeyGridProps = {
  label: string;
  options: readonly MusicKey[];
  selectedRoot?: number;
  onSelect: (key: MusicKey) => void;
  markedRoot?: number;
  markedLabel?: string;
  className?: string;
};

export function KeyGrid({
  label,
  options,
  selectedRoot,
  onSelect,
  markedRoot,
  markedLabel,
  className,
}: KeyGridProps) {
  return (
    <fieldset className={cn('m-0 grid min-w-0 grid-cols-4 gap-1 border-0 p-0', className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const isMarked = option.root === markedRoot;
        return (
          <button
            key={option.root}
            type="button"
            aria-pressed={option.root === selectedRoot}
            aria-label={
              isMarked && markedLabel ? `${keyLabel(option)}, ${markedLabel}` : keyLabel(option)
            }
            onClick={() => onSelect(option)}
            className={cn(
              'bg-fill-hover hover:bg-fill-press aria-pressed:bg-chord aria-pressed:text-ground relative h-10 rounded-xl font-mono font-semibold transition-colors',
              isMarked &&
                'after:absolute after:bottom-[5px] after:left-1/2 after:size-1 after:-translate-x-1/2 after:bg-current after:opacity-75'
            )}
          >
            {keyLabel(option)}
          </button>
        );
      })}
    </fieldset>
  );
}
