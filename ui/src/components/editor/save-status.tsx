import { Check } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import type { SaveStatus as Status } from '@/hooks/use-autosave';
import { cn } from '@/lib/utils';

type SaveStatusProps = {
  status: Status;
  onRetry?: () => void;
  className?: string;
};

// The Saving… / Saved chip. A polite live region, so a screen reader hears the change without losing its place.
export function SaveStatus({ status, onRetry, className }: SaveStatusProps) {
  const { t } = useTranslation();
  return (
    <output
      data-state={status}
      className={cn(
        'text-ink-3 inline-flex items-center gap-1.5 text-[0.8125rem] data-[state=error]:text-destructive data-[state=saving]:text-ink-2',
        className
      )}
    >
      {status === 'saved' ? <Check className="text-ok size-3.5" aria-hidden /> : null}
      {t(`editor.frame.${status === 'error' ? 'saveFailed' : status}`)}
      {status === 'error' && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-chord hover:bg-fill-hover -my-1 rounded-md px-1.5 py-1 font-semibold"
        >
          {t('editor.frame.retry')}
        </button>
      ) : null}
    </output>
  );
}
