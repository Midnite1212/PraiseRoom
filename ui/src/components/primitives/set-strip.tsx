import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import type { SetStatus } from './set-status';

const PIXEL_CLASSES: Record<SetStatus, string> = {
  next: 'bg-pixel-on shadow-[0_0_6px_var(--pixel-glow)]',
  up: 'bg-ink/26',
  undated: 'bg-ink/26',
  past: 'bg-ink/62',
};

// A setlist's songs as a strip of light: one square per song, lit by the set's status.
export function SetStrip({
  status,
  titles,
  className,
}: {
  status: SetStatus;
  titles: readonly string[];
  className?: string;
}) {
  const { t } = useTranslation();
  if (titles.length === 0)
    return (
      <span className={cn('text-ink-3 mt-2 text-xs', className)}>{t('setlists.stripEmpty')}</span>
    );
  const seen = new Map<string, number>();
  const pixels = titles.map((title) => {
    const count = (seen.get(title) ?? 0) + 1;
    seen.set(title, count);
    return { key: `${title}-${count}` };
  });
  return (
    <span className={cn('mt-2 flex flex-wrap gap-[3px]', className)}>
      <span className="sr-only">
        {t('setlists.stripLabel', {
          songs: t('reader.songCount', { count: titles.length }),
          titles: titles.join(', '),
        })}
      </span>
      {pixels.map(({ key }) => (
        <i key={key} aria-hidden className={cn('size-[7px]', PIXEL_CLASSES[status])} />
      ))}
    </span>
  );
}
