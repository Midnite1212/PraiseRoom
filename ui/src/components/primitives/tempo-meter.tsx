import { useTranslation } from 'react-i18next';

import { TEMPO_LABEL_KEYS } from '@/features/songs/api';
import { cn } from '@/lib/utils';

const TEMPOS: Readonly<
  Record<
    string,
    { level: number; labelKey: (typeof TEMPO_LABEL_KEYS)[keyof typeof TEMPO_LABEL_KEYS] }
  >
> = {
  Slow: { level: 1, labelKey: TEMPO_LABEL_KEYS.Slow },
  'Medium Slow': { level: 2, labelKey: TEMPO_LABEL_KEYS['Medium Slow'] },
  Medium: { level: 3, labelKey: TEMPO_LABEL_KEYS.Medium },
  Fast: { level: 4, labelKey: TEMPO_LABEL_KEYS.Fast },
};

const BAR_HEIGHTS = ['h-1', 'h-1.5', 'h-2', 'h-2.5'] as const;

// A song carries a list of tempos; the meter shows the fastest, 0 when none is known.
export const tempoLevel = (tempo: readonly string[]): number =>
  Math.max(0, ...tempo.map((name) => TEMPOS[name]?.level ?? 0));

export const tempoLabelKey = (tempo: readonly string[]) =>
  Object.values(TEMPOS).find((entry) => entry.level === tempoLevel(tempo))?.labelKey;
// The translation key for the tempo the meter shows, undefined when none is known.
export const tempoLabelKey = (tempo: readonly string[]) => {
  const level = tempoLevel(tempo);
  return Object.values(TEMPOS).find((entry) => entry.level === level)?.labelKey;
};

// Tempo as four rising bars, lit up to the song's level.
export function TempoMeter({ tempo, className }: { tempo: readonly string[]; className?: string }) {
  const { t } = useTranslation();
  const level = tempoLevel(tempo);
  const labelKey = tempoLabelKey(tempo);
  if (!labelKey) return null;
  const label = t(labelKey);
  return (
    <span
      title={label}
      className={cn('inline-flex h-2.5 items-end gap-0.5 align-middle', className)}
    >
      <span className="sr-only">{t('songs.tempoLabel', { tempo: label })}</span>
      {BAR_HEIGHTS.map((height, index) => (
        <i
          key={height}
          aria-hidden
          className={cn('w-[3px]', height, index < level ? 'bg-ink-2' : 'bg-ink/20')}
        />
      ))}
    </span>
  );
}
