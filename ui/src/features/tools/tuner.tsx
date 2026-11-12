import { ArrowDown, ArrowUp, Check, Lock, Mic, MicOff } from 'pixelarticons/react';
import { type ComponentProps, type ComponentType, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupTitle } from '@/components/page/group-title';
import { SetRow } from '@/components/primitives/set-row';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  clampCents,
  formatCents,
  type GuitarString,
  IN_TUNE_CENTS,
  MAX_CENTS,
  nearestNote,
  noteLabel,
  readTuning,
  STANDARD_TUNING,
  type TuningReading,
  type TuningState,
} from './tuning';
import { type TunerStatus, useTuner } from './use-tuner';

type Icon = ComponentType<ComponentProps<'svg'>>;
type NoticeStatus = Exclude<TunerStatus, 'listening'>;

const NOTICE_ICONS: Record<NoticeStatus, Icon> = {
  idle: Mic,
  asking: Mic,
  denied: MicOff,
  unavailable: MicOff,
  insecure: Lock,
};
const NOTICE_ROLES: Record<NoticeStatus, 'status' | 'alert' | undefined> = {
  idle: undefined,
  asking: 'status',
  denied: 'alert',
  unavailable: 'alert',
  insecure: 'alert',
};
const STATE_ICONS: Record<TuningState, Icon> = { flat: ArrowUp, inTune: Check, sharp: ArrowDown };
const TICKS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

function Notice({ status, children }: { status: NoticeStatus; children?: ReactNode }) {
  const { t } = useTranslation();
  const NoticeIcon = NOTICE_ICONS[status];
  return (
    <div role={NOTICE_ROLES[status]} className="bg-fill-hover rounded-2xl px-4 py-7 text-center">
      <NoticeIcon aria-hidden className="text-ink-3 mx-auto mb-3 size-8" />
      <b className="text-ink text-card-title block">{t(`tools.tuner.${status}.title`)}</b>
      <p className="text-ink-2 mx-auto mt-1.5 max-w-[46ch] text-sm text-balance">
        {t(`tools.tuner.${status}.body`)}
      </p>
      {children}
    </div>
  );
}

function Meter({ reading, valueText }: { reading: TuningReading | null; valueText: string }) {
  const { t } = useTranslation();
  const cents = reading ? clampCents(reading.cents) : null;
  return (
    <div className="mx-auto mt-4 max-w-[26rem]">
      <svg viewBox="-56 0 112 31" aria-hidden className="block w-full">
        <rect
          x={-IN_TUNE_CENTS}
          y={3}
          width={2 * IN_TUNE_CENTS}
          height={18}
          rx={1.5}
          className="fill-ok/25"
        />
        {TICKS.map((tick) => (
          <line
            key={tick}
            x1={tick}
            x2={tick}
            y1={tick % 50 === 0 ? 5 : 9}
            y2={21}
            strokeWidth={tick === 0 ? 1 : 0.5}
            className="stroke-ink-3"
          />
        ))}
        {reading && cents !== null ? (
          <g
            transform={`translate(${cents} 0)`}
            className={reading.state === 'inTune' ? 'fill-ok' : 'fill-ink'}
          >
            <rect x={-1} y={0} width={2} height={24} rx={1} />
            <path d="M-4 31 L0 24.5 L4 31 Z" />
          </g>
        ) : null}
      </svg>
      <span aria-hidden className="text-ink-3 flex justify-between text-xs font-semibold">
        <span>{t('tools.tuner.scale.flat')}</span>
        <span>{t('tools.tuner.scale.sharp')}</span>
      </span>
      {cents === null ? null : (
        <meter
          aria-label={t('tools.tuner.meter')}
          aria-valuetext={valueText}
          min={-MAX_CENTS}
          max={MAX_CENTS}
          value={Math.round(cents)}
          className="sr-only"
        />
      )}
    </div>
  );
}

function Reading({
  reading,
  target,
}: {
  reading: TuningReading | null;
  target: GuitarString | null;
}) {
  const { t } = useTranslation();
  const StateIcon = reading ? STATE_ICONS[reading.state] : null;
  const inTune = reading?.state === 'inTune';
  const offset = reading
    ? t('tools.tuner.cents', {
        count: Math.abs(Math.round(reading.cents)),
        cents: formatCents(reading.cents),
      })
    : '';
  const state = reading ? t(`tools.tuner.state.${reading.state}`) : '';

  return (
    <div className="bg-fill-hover rounded-2xl px-4 pt-5 pb-4 text-center">
      <span className="text-ink-3 block text-xs font-semibold">
        {target
          ? t('tools.tuner.stringNumber', { number: target.number })
          : t('tools.tuner.listening.title')}
      </span>
      <b
        className={cn(
          'mt-1 block font-mono text-8xl leading-none font-bold',
          inTune ? 'text-ok' : reading ? 'text-ink' : 'text-ink-3'
        )}
      >
        {target ? (
          <>
            {target.name}
            <span className="text-3xl">{target.octave}</span>
          </>
        ) : (
          '–'
        )}
      </b>
      <Meter
        reading={reading}
        valueText={
          reading
            ? t('tools.tuner.reading', { note: noteLabel(reading.string), offset, state })
            : ''
        }
      />
      <div className="mt-3 flex min-h-[4.25rem] flex-col items-center justify-center">
        {reading && StateIcon ? (
          <>
            <p className={cn('flex items-center gap-2 text-2xl font-bold', inTune && 'text-ok')}>
              <StateIcon aria-hidden className="size-6" />
              {state}
            </p>
            <p className="text-ink-2 mt-1 font-mono text-lg">{offset}</p>
          </>
        ) : (
          <output className="text-ink-2 block text-base">{t('tools.tuner.listening.body')}</output>
        )}
      </div>
    </div>
  );
}

export function Tuner() {
  const { t } = useTranslation();
  const { status, frequency, start, stop } = useTuner();
  const [lockedNumber, setLockedNumber] = useState<number | null>(null);
  const locked = STANDARD_TUNING.find((string) => string.number === lockedNumber) ?? null;
  const listening = status === 'listening';
  const reading = listening && frequency !== null ? readTuning(frequency, locked) : null;
  const canTune = listening || status === 'idle' || status === 'asking';

  return (
    <div className="wide:max-w-[720px]">
      {status === 'listening' ? (
        <Reading reading={reading} target={reading?.string ?? locked} />
      ) : (
        <Notice status={status}>
          {status === 'idle' ? (
            <Button size="lg" className="mt-5" onClick={start}>
              <Mic />
              {t('tools.tuner.start')}
            </Button>
          ) : null}
          {status === 'asking' ? (
            <Button variant="secondary" size="lg" className="mt-5" onClick={stop}>
              {t('tools.tuner.stop')}
            </Button>
          ) : null}
          {status === 'denied' || status === 'unavailable' ? (
            <Button size="lg" className="mt-5" onClick={start}>
              {t('tools.tuner.retry')}
            </Button>
          ) : null}
          {status === 'idle' || status === 'asking' ? (
            <p className="text-ink-3 mt-4 text-xs">{t('tools.tuner.privacy')}</p>
          ) : null}
        </Notice>
      )}
      {canTune ? (
        <>
          <GroupTitle
            first
            title={t('tools.tuner.strings')}
            hint={locked ? t('tools.tuner.lockedHint') : t('tools.tuner.autoHint')}
          />
          <fieldset className="m-0 grid min-w-0 grid-cols-6 gap-1 border-0 p-0">
            <legend className="sr-only">{t('tools.tuner.strings')}</legend>
            {STANDARD_TUNING.map((string) => (
              <button
                key={string.number}
                type="button"
                aria-pressed={string.number === lockedNumber}
                aria-current={reading?.string.number === string.number ? 'true' : undefined}
                aria-label={t('tools.tuner.string', {
                  number: string.number,
                  note: noteLabel(string),
                })}
                onClick={() =>
                  setLockedNumber(string.number === lockedNumber ? null : string.number)
                }
                className="bg-fill-hover hover:bg-fill-press aria-pressed:bg-chord aria-pressed:text-ground aria-[current=true]:outline-chord h-14 rounded-xl font-mono font-semibold transition-colors aria-[current=true]:outline-2 aria-[current=true]:outline-offset-2"
              >
                <span className="block text-lg leading-none">{string.name}</span>
                <span className="mt-1 block text-[0.6875rem] leading-none opacity-70">
                  {string.number}
                </span>
              </button>
            ))}
          </fieldset>
        </>
      ) : null}
      {listening ? (
        <>
          <SetRow label={t('tools.tuner.heard')} className="mt-3">
            <span className="text-ink-2 pr-2 font-mono text-sm">
              {frequency === null
                ? '–'
                : t('tools.tuner.heardValue', {
                    note: noteLabel(nearestNote(frequency).note),
                    hertz: frequency.toFixed(1),
                  })}
            </span>
          </SetRow>
          <Button variant="secondary" size="lg" className="wide:w-auto mt-4 w-full" onClick={stop}>
            {t('tools.tuner.stop')}
          </Button>
        </>
      ) : null}
    </div>
  );
}
