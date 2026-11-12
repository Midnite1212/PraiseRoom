import { Minus, Play, Plus, Stop, VolumeX } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupTitle } from '@/components/page/group-title';
import { Segmented } from '@/components/primitives/segmented';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import {
  type Accent,
  addTap,
  beatAccent,
  beatsPerBar,
  MAX_BPM,
  MIN_BPM,
  tapTempo,
  TIME_SIGNATURES,
  type TimeSignature,
} from './tempo';
import { useMetronome } from './use-metronome';

const BAR_COLUMNS: Record<TimeSignature, string> = {
  '2/4': 'grid-cols-2',
  '3/4': 'grid-cols-3',
  '4/4': 'grid-cols-4',
  '6/8': 'grid-cols-6',
};

const BEAT_CLASSES: Record<Accent, string> = {
  strong: 'text-brand aria-[current=true]:bg-brand aria-[current=true]:text-on-brand',
  medium: 'text-ink aria-[current=true]:bg-ink aria-[current=true]:text-ground',
  weak: 'text-ink-3 aria-[current=true]:bg-ink aria-[current=true]:text-ground',
};

const wholeBpm = (text: string): number | null => {
  const value = Number(text);
  return text.trim() !== '' && Number.isInteger(value) ? value : null;
};

function BeatIndicator({ signature, beat }: { signature: TimeSignature; beat: number | null }) {
  const { t } = useTranslation();
  return (
    <ol
      aria-label={t('tools.metronome.beats')}
      className={cn('m-0 mt-5 grid list-none gap-1.5 p-0', BAR_COLUMNS[signature])}
    >
      {Array.from({ length: beatsPerBar(signature) }, (_, index) => {
        const accent = beatAccent(index, signature);
        return (
          <li
            key={index}
            aria-current={beat === index ? 'true' : undefined}
            className={cn(
              'bg-fill-press flex h-16 items-center justify-center rounded-xl font-mono text-2xl font-bold',
              BEAT_CLASSES[accent]
            )}
          >
            <span aria-hidden>{index + 1}</span>
            <span className="sr-only">
              {t(accent === 'weak' ? 'tools.metronome.beat' : 'tools.metronome.accentedBeat', {
                number: index + 1,
              })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Metronome() {
  const { t } = useTranslation();
  const { status, beat, bpm, signature, start, stop, setBpm, setSignature } = useMetronome();
  const [draft, setDraft] = useState<string | null>(null);
  const [taps, setTaps] = useState<number[]>([]);
  const playing = status === 'playing';

  const typeBpm = (text: string) => {
    setDraft(text);
    const value = wholeBpm(text);
    if (value !== null && value >= MIN_BPM && value <= MAX_BPM) setBpm(value);
  };

  const commitDraft = () => {
    const value = draft === null ? null : wholeBpm(draft);
    if (value !== null) setBpm(value);
    setDraft(null);
  };

  const tap = () => {
    const next = addTap(taps, performance.now());
    setTaps(next);
    const tempo = tapTempo(next);
    if (tempo !== null) setBpm(tempo);
  };

  return (
    <div className="wide:max-w-[720px]">
      {status === 'unavailable' ? (
        <div role="alert" className="bg-fill-hover mb-4 rounded-2xl px-4 py-5 text-center">
          <VolumeX aria-hidden className="text-ink-3 mx-auto mb-2 size-8" />
          <b className="text-ink text-card-title block">{t('tools.metronome.unavailable.title')}</b>
          <p className="text-ink-2 mx-auto mt-1.5 max-w-[46ch] text-sm text-balance">
            {t('tools.metronome.unavailable.body')}
          </p>
        </div>
      ) : null}
      <section
        aria-label={t('tools.metronome.title')}
        className="bg-fill-hover rounded-2xl px-4 pt-5 pb-4 text-center"
      >
        <p className="m-0 flex items-baseline justify-center gap-2">
          <b className="text-ink font-mono text-8xl leading-none font-bold">{bpm}</b>
          <span className="text-ink-3 text-sm font-semibold">{t('tools.metronome.bpm')}</span>
        </p>
        <span className="text-ink-2 mt-2 block font-mono text-sm font-semibold">{signature}</span>
        <BeatIndicator signature={signature} beat={playing ? beat : null} />
      </section>
      <Button
        size="lg"
        variant={playing ? 'secondary' : 'default'}
        className="wide:w-auto mt-4 w-full"
        disabled={status === 'unavailable'}
        onClick={playing ? stop : start}
      >
        {playing ? <Stop /> : <Play />}
        {playing ? t('tools.metronome.stop') : t('tools.metronome.start')}
      </Button>
      <GroupTitle
        title={t('tools.metronome.tempo')}
        hint={t('tools.metronome.range', { min: MIN_BPM, max: MAX_BPM })}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          aria-label={t('tools.metronome.slower')}
          disabled={bpm <= MIN_BPM}
          onClick={() => setBpm(bpm - 1)}
        >
          <Minus />
        </Button>
        <Input
          aria-label={t('tools.metronome.bpmField')}
          inputMode="numeric"
          enterKeyHint="done"
          value={draft ?? String(bpm)}
          onChange={(event) => typeBpm(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          className="h-11 w-20 text-center font-mono font-semibold"
        />
        <Button
          variant="secondary"
          size="icon"
          aria-label={t('tools.metronome.faster')}
          disabled={bpm >= MAX_BPM}
          onClick={() => setBpm(bpm + 1)}
        >
          <Plus />
        </Button>
        <Button variant="secondary" className="min-w-0 flex-1" onClick={tap}>
          {t('tools.metronome.tap')}
        </Button>
      </div>
      <input
        type="range"
        aria-label={t('tools.metronome.slider')}
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        value={bpm}
        onChange={(event) => setBpm(Number(event.target.value))}
        className="accent-brand mt-3 block h-11 w-full cursor-pointer"
      />
      <GroupTitle
        title={t('tools.metronome.signature')}
        hint={signature === '6/8' ? t('tools.metronome.compoundHint') : undefined}
      />
      <Segmented
        value={signature}
        onChange={setSignature}
        label={t('tools.metronome.signature')}
        mono
        className="wide:w-auto w-full"
        options={TIME_SIGNATURES.map((value) => ({ value, label: value }))}
      />
    </div>
  );
}
