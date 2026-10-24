import { Link } from '@tanstack/react-router';
import { ChevronRight, Sliders, Tv } from 'pixelarticons/react';
import { useState } from 'react';
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
import { enterFullscreen } from './fullscreen';
import { useKeepAwake, wakeLockSupported } from './keep-awake';
import type { PresentSong } from './present-slides';
import { Presentation } from './presentation';

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

export function ColourDots() {
  return (
    <span aria-hidden className="inline-flex gap-[3px]">
      <i className="bg-chord size-[7px]" />
      <i className="bg-chord-four size-[7px]" />
      <i className="bg-chord-five size-[7px]" />
      <i className="bg-chord-minor size-[7px]" />
    </span>
  );
}

type PresentOption = {
  songs: PresentSong[];
  // The song the reader is on; the presentation opens at its title slide.
  startIndex: number;
  // Called as the presentation opens, e.g. to stop auto-scroll.
  onStart?: () => void;
  // Called with the song the presentation stopped on.
  onExit: (songIndex: number) => void;
};

// The sliders button and the tray behind it: what you set once and read every song with, saved on this
// device. The settings link shows in the app only; the public setlist link has no Settings page.
// `present` adds the Present to TV row and owns the overlay it opens.
export function ReadingSettings({
  showSettingsLink = true,
  present,
}: {
  showSettingsLink?: boolean;
  present?: PresentOption;
}) {
  const { t } = useTranslation();
  const [chordStyle, setChordStyle] = useChordStyle();
  const [accidentals, setAccidentals] = useAccidentals();
  const [colourChords, setColourChords] = useColourChords();
  const [keepAwake, setKeepAwake] = useKeepAwake();
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const awakeHint = wakeLockSupported()
    ? keepAwake === 'on'
      ? t('reader.awakeOn')
      : undefined
    : t('reader.awakeOff');

  const startPresenting = () => {
    present?.onStart?.();
    setIsTrayOpen(false);
    setIsPresenting(true);
    void enterFullscreen();
  };

  return (
    <>
      <Tray
        open={isTrayOpen}
        onOpenChange={setIsTrayOpen}
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
          {present && present.songs.length > 0 ? (
            <SetRow
              label={t('reader.present.row')}
              hint={t('reader.present.hint')}
              onClick={startPresenting}
            >
              <Tv aria-hidden className="text-ink-2 mr-2 flex-none" />
            </SetRow>
          ) : null}
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
      {present && isPresenting ? (
        <Presentation
          songs={present.songs}
          startIndex={present.startIndex}
          onExit={(songIndex) => {
            setIsPresenting(false);
            present.onExit(songIndex);
          }}
        />
      ) : null}
    </>
  );
}
