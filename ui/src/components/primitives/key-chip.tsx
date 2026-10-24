import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

// The key as a small mono chip.
export function KeyChip({ musicKey, className }: { musicKey: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      aria-label={t('songs.keyLabel', { key: musicKey })}
      className={cn(
        'bg-fill-hover text-ink inline-grid h-6 min-w-[30px] flex-none place-items-center rounded-lg px-1.5 font-mono text-[0.8125rem] font-bold',
        className
      )}
    >
      {musicKey}
    </span>
  );
}

// The key over the time signature in a square that leads a song row, as a date block leads a setlist row.
export function KeyTile({
  musicKey,
  timeSignature,
  className,
}: {
  musicKey: string;
  timeSignature?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'bg-fill-hover grid size-13 flex-none content-center justify-items-center gap-0.5 rounded-[14px] text-center leading-none',
        className
      )}
    >
      <b className="font-mono text-[1.125rem] font-bold">{musicKey}</b>
      {timeSignature ? (
        <small className="text-ink-3 font-mono text-[0.6875rem] font-semibold">
          {timeSignature}
        </small>
      ) : null}
    </span>
  );
}
