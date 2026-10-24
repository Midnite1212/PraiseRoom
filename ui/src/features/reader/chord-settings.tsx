import { KeyboardMusic } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Panel } from '@/components/primitives/panel';
import { Segmented } from '@/components/primitives/segmented';
import { SetRow } from '@/components/primitives/set-row';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import {
  ACCIDENTALS,
  type Accidentals,
  CHORD_NOTATIONS,
  CHORD_STYLES,
  useAccidentals,
  useChordNotation,
  useChordStyle,
  useColourChords,
  useGuitarCapo,
} from './chord-display';

const ACCIDENTAL_LABELS = { sharp: '#', flat: 'b' } as const;

function AccidentalsControl({
  accidentals,
  onChange,
}: {
  accidentals: Accidentals;
  onChange: (accidentals: Accidentals) => void;
}) {
  const { t } = useTranslation();
  return (
    <Segmented
      mono
      size="sm"
      value={accidentals}
      onChange={onChange}
      label={t('reader.accidentals')}
      options={ACCIDENTALS.map((value) =>
        value === 'auto'
          ? { value, label: t('reader.auto') }
          : { value, label: ACCIDENTAL_LABELS[value], ariaLabel: t(`reader.${value}`) }
      )}
    />
  );
}

// The gear: how chords read, for every song on this device. Later chord options add their rows here.
export function ChordSettingsPanel({ glass = false }: { glass?: boolean }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notation, setNotation] = useChordNotation();
  const [chordStyle, setChordStyle] = useChordStyle();
  const [accidentals, setAccidentals] = useAccidentals();
  const [colourChords, setColourChords] = useColourChords();
  const [guitarCapo, setGuitarCapo] = useGuitarCapo();

  return (
    <Panel
      open={isOpen}
      onOpenChange={setIsOpen}
      title={t('reader.chordSettings')}
      description={t('reader.allSongs')}
      align="end"
      sheetClassName="bottom-[calc(var(--bottom)+var(--dock-h)+10px)]"
      trigger={
        <Button
          variant={glass ? 'glass' : 'ghost'}
          size={glass ? 'icon-lg' : 'icon'}
          aria-label={t('reader.chordSettings')}
          title={t('reader.chordSettings')}
        >
          <KeyboardMusic />
        </Button>
      }
    >
      <div className="flex flex-col gap-1.5">
        <SetRow label={t('reader.showChordsAs')}>
          <Segmented
            size="sm"
            value={notation}
            onChange={setNotation}
            label={t('reader.showChordsAs')}
            options={CHORD_NOTATIONS.toReversed().map((value) => ({
              value,
              label: t(`reader.${value}`),
            }))}
          />
        </SetRow>
        <SetRow label={t('reader.chordsStyle')} hint={t('reader.simpleHint')}>
          <Segmented
            size="sm"
            value={chordStyle}
            onChange={setChordStyle}
            label={t('reader.chordsStyle')}
            options={CHORD_STYLES.map((value) => ({ value, label: t(`reader.${value}`) }))}
          />
        </SetRow>
        <SetRow label={t('reader.colourChords')} hint={t('reader.colourHint')}>
          <Switch
            aria-label={t('reader.colourChords')}
            checked={colourChords === 'on'}
            onCheckedChange={(checked) => setColourChords(checked ? 'on' : 'off')}
          />
        </SetRow>
        <SetRow label={t('reader.accidentals')}>
          <AccidentalsControl accidentals={accidentals} onChange={setAccidentals} />
        </SetRow>
        <SetRow label={t('reader.guitarCapo')} hint={t('reader.capoHint')}>
          <Switch
            aria-label={t('reader.guitarCapo')}
            checked={guitarCapo === 'on'}
            onCheckedChange={(checked) => setGuitarCapo(checked ? 'on' : 'off')}
          />
        </SetRow>
      </div>
      <Button onClick={() => setIsOpen(false)}>{t('reader.done')}</Button>
    </Panel>
  );
}
