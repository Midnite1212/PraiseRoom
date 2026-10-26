import { Pause, Play } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/primitives/segmented';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  AUTO_SCROLL_SPEEDS,
  type AutoScroll,
  type AutoScrollSpeed,
  useScrollSpeed,
} from './auto-scroll';

const TEMPO_BAR_HEIGHTS = ['h-[5px]', 'h-2', 'h-3'] as const;

// Three bars that grow with the speed: the bars up to `level` are lit.
export function TempoIcon({ level }: { level: number }) {
  return (
    <span aria-hidden className="inline-flex h-3 items-end gap-0.5">
      {TEMPO_BAR_HEIGHTS.map((height, index) => (
        <i
          key={height}
          className={cn('w-[3px] bg-current', height, index >= level && 'opacity-25')}
        />
      ))}
    </span>
  );
}

// Play and pause: in the top bar on wide screens, in the dock on phones.
export function AutoScrollButton({
  auto,
  placement,
  className,
}: {
  auto: AutoScroll;
  placement: 'top' | 'dock';
  className?: string;
}) {
  const { t } = useTranslation();
  const label = auto.running ? t('reader.autoScroll.pause') : t('reader.autoScroll.start');
  return (
    <Button
      variant="glass"
      size={placement === 'top' ? 'icon-lg' : 'dock'}
      aria-label={label}
      title={label}
      aria-pressed={auto.running}
      data-keeps-tray
      onClick={auto.toggle}
      className={cn(
        'aria-pressed:[--glass-fill:color-mix(in_oklab,var(--chord)_28%,var(--glass-tint))]',
        className
      )}
    >
      {auto.running ? <Pause /> : <Play />}
    </Button>
  );
}

// The Aa tray's Scroll speed row and the note that says where the play button is.
export function ScrollSpeedRow({ auto }: { auto: AutoScroll }) {
  const { t } = useTranslation();
  const [speed, setSpeed] = useScrollSpeed();
  const where = t(`reader.autoScroll.${auto.where}`);
  return (
    <>
      <div className="mt-3 flex items-center justify-between gap-2.5">
        <span className="text-ink-2 text-[0.8125rem] font-semibold">
          {t('reader.autoScroll.speed')}
        </span>
        <Segmented<AutoScrollSpeed>
          size="sm"
          value={speed}
          onChange={setSpeed}
          label={t('reader.autoScroll.speed')}
          options={AUTO_SCROLL_SPEEDS.map((value, index) => ({
            value,
            label: <TempoIcon level={index + 1} />,
            ariaLabel: t(`reader.autoScroll.${value}`),
          }))}
        />
      </div>
      <p className="text-ink-3 mt-3 mr-0.5 ml-0.5 flex items-center gap-1.5 text-xs">
        {auto.running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        {t(auto.running ? 'reader.autoScroll.noteOn' : 'reader.autoScroll.noteIdle', { where })}
      </p>
    </>
  );
}
