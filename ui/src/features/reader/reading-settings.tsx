import { Link } from '@tanstack/react-router';
import { ChevronRight, Sliders } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { LanguageChoice, ThemeChoice } from '@/components/layout/preference-choices';
import { Segmented } from '@/components/primitives/segmented';
import { SetRow } from '@/components/primitives/set-row';
import { Tray } from '@/components/primitives/tray';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import {
  ACCIDENTALS,
  CHORD_STYLES,
  type ChordStyle,
  useAccidentals,
  useChordStyle,
  useColourChords,
} from './chord-display';
import { useKeepAwake, wakeLockSupported } from './keep-awake';

const ACCIDENTAL_LABELS = { sharp: 'F#', flat: 'Gb' } as const;

function ChordStyleLabel({ style }: { style: ChordStyle }) {
  return style === 'full' ? (
    <>
      G<sup className="align-[0.5em] text-[0.68em] leading-none">sus4</sup>
    </>
  ) : (
    'G'
  );
}

function ColourDots() {
  return (
    <span aria-hidden className="inline-flex gap-[3px]">
      <i className="bg-chord size-[7px]" />
      <i className="bg-chord-four size-[7px]" />
      <i className="bg-chord-five size-[7px]" />
      <i className="bg-chord-minor size-[7px]" />
    </span>
  );
}

// The sliders button and the tray behind it: what you set once and read every song with, saved on this
// device. The settings link shows in the app only; the public setlist link has no Settings page.
export function ReadingSettings({ showSettingsLink = true }: { showSettingsLink?: boolean }) {
  const { t } = useTranslation();
  const [chordStyle, setChordStyle] = useChordStyle();
  const [accidentals, setAccidentals] = useAccidentals();
  const [colourChords, setColourChords] = useColourChords();
  const [keepAwake, setKeepAwake] = useKeepAwake();
  const awakeHint = wakeLockSupported()
    ? keepAwake === 'on'
      ? t('reader.awakeOn')
      : undefined
    : t('reader.awakeOff');

  return (
    <Tray
      title={t('reader.readingSettings')}
      description={t('reader.savedHere')}
      trigger={
        <Button
          variant="glass"
          size="icon-lg"
          aria-label={t('reader.readingSettings')}
          title={t('reader.readingSettings')}
        >
          <Sliders />
        </Button>
      }
    >
      <div className="flex flex-col gap-1.5">
        <SetRow label={t('reader.chordStyle')}>
          <Segmented
            mono
            size="sm"
            value={chordStyle}
            onChange={setChordStyle}
            label={t('reader.chordStyle')}
            options={CHORD_STYLES.map((value) => ({
              value,
              label: <ChordStyleLabel style={value} />,
              ariaLabel: t(`reader.${value}`),
            }))}
          />
        </SetRow>
        <SetRow label={t('reader.colourChords')}>
          <span className="flex items-center gap-2.5">
            <ColourDots />
            <Switch
              aria-label={t('reader.colourChords')}
              checked={colourChords === 'on'}
              onCheckedChange={(checked) => setColourChords(checked ? 'on' : 'off')}
            />
          </span>
        </SetRow>
        <SetRow label={t('reader.accidentals')}>
          <Segmented
            mono
            size="sm"
            value={accidentals}
            onChange={setAccidentals}
            label={t('reader.accidentals')}
            options={ACCIDENTALS.map((value) =>
              value === 'auto'
                ? { value, label: t('reader.auto') }
                : { value, label: ACCIDENTAL_LABELS[value], ariaLabel: t(`reader.${value}`) }
            )}
          />
        </SetRow>
        <SetRow label={t('theme.label')}>
          <ThemeChoice compact />
        </SetRow>
        <SetRow label={t('language.label')}>
          <LanguageChoice compact />
        </SetRow>
        <SetRow label={t('reader.keepAwake')} hint={awakeHint}>
          <Switch
            aria-label={t('reader.keepAwake')}
            checked={keepAwake === 'on'}
            onCheckedChange={(checked) => setKeepAwake(checked ? 'on' : 'off')}
          />
        </SetRow>
      </div>
      {showSettingsLink ? (
        <Button
          asChild
          variant="ghost"
          className="text-ink-2 mt-2 h-11 justify-between rounded-[14px] px-3 text-sm font-semibold"
        >
          <Link to="/settings">
            {t('reader.moreSettings')}
            <ChevronRight />
          </Link>
        </Button>
      ) : null}
    </Tray>
  );
}
