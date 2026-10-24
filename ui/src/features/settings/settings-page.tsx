import { Link } from '@tanstack/react-router';
import { ChevronRight, Logout } from 'pixelarticons/react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageChoice, ThemeChoice } from '@/components/layout/preference-choices';
import { PageHeader } from '@/components/page/page-header';
import { toInitials } from '@/components/primitives/avatar';
import { Segmented } from '@/components/primitives/segmented';
import { Vinyl } from '@/components/primitives/vinyl';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Session } from '@/features/auth/session';
import { useSignOut } from '@/features/auth/use-sign-out';
import { AUTO_SCROLL_SPEEDS, useScrollSpeed } from '@/features/reader/auto-scroll';
import { TempoIcon } from '@/features/reader/auto-scroll-controls';
import {
  ACCIDENTALS,
  CHORD_STYLES,
  type ChordNotation,
  useAccidentals,
  useChordNotation,
  useChordStyle,
  useColourChords,
} from '@/features/reader/chord-display';
import { useKeepAwake, wakeLockSupported } from '@/features/reader/keep-awake';
import { LYRICS_SIZES, type LyricsSize, useLyricsSize } from '@/features/reader/lyrics-size';
import { ColourDots } from '@/features/reader/reading-settings';
import { useIsRoomy } from '@/hooks/use-wide';
import { ACCENTS, useAccent } from '@/lib/accent';
import { canRefract, GLASS_STYLES, useGlassStyle } from '@/lib/liquid-glass';
import { TYPEFACES, useTypeface } from '@/lib/typeface';
import { cn } from '@/lib/utils';

import { SettingsGroup, SettingsRow } from './settings-group';
import { SettingsPreview } from './settings-preview';

// On a phone a segmented control stretches under its label; on a wide screen it keeps its own width.
const STRETCH = 'w-full wide:w-auto';

const ACCIDENTAL_LABELS = { auto: null, sharp: 'C#m', flat: 'Dbm' } as const;

const AA_SIZE_CLASSES = {
  sm: 'text-[0.9375rem]',
  md: 'text-[1.0625rem]',
  lg: 'text-[1.125rem]',
  xl: 'text-[1.3rem]',
  '2xl': 'text-[1.5rem]',
} as const satisfies Record<LyricsSize, string>;

function SeventhLabel({ name, seventh }: { name: ReactNode; seventh: boolean }) {
  return (
    <span>
      {name} · B{seventh ? <sup className="align-[0.5em] text-[0.68em] leading-[0]">7</sup> : null}
    </span>
  );
}

function FontTiles() {
  const { t } = useTranslation();
  const [typeface, setTypeface] = useTypeface();
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={typeface}
      onValueChange={(next) => {
        const choice = TYPEFACES.find((candidate) => candidate === next);
        if (choice) setTypeface(choice);
      }}
      aria-label={t('settings.font.title')}
      className="grid grid-cols-2 gap-1.5"
    >
      {TYPEFACES.map((value) => (
        <ToggleGroupPrimitive.Item
          key={value}
          value={value}
          data-typeface={value}
          className="bg-fill-hover hover:liquid-hover data-[state=on]:liquid-on data-[state=on]:hover:liquid-on min-h-11 rounded-2xl px-3.5 py-2.5 text-left font-sans text-sm font-semibold transition-colors"
        >
          {t(`settings.font.options.${value}`)}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}

function AccentSwatches() {
  const { t } = useTranslation();
  const [accent, setAccent] = useAccent();
  return (
    <div className="text-ink-2 flex items-center gap-2.5 text-sm font-semibold">
      <ToggleGroupPrimitive.Root
        type="single"
        value={accent}
        onValueChange={(next) => {
          const choice = ACCENTS.find((candidate) => candidate === next);
          if (choice) setAccent(choice);
        }}
        aria-label={t('settings.accent.title')}
        className="-ml-2 flex gap-1.5"
      >
        {ACCENTS.map((value) => (
          <ToggleGroupPrimitive.Item
            key={value}
            value={value}
            aria-label={t(`settings.accent.options.${value}`)}
            title={t(`settings.accent.options.${value}`)}
            className="not-data-[state=on]:hover:liquid-hover grid size-10 place-items-center rounded-full transition-colors data-[state=on]:shadow-[inset_0_0_0_2px_var(--ink)]"
          >
            <span
              aria-hidden
              data-palette={value}
              className="bg-brand size-6 rounded-full shadow-[inset_0_0_0_1px_var(--hairline)]"
            />
          </ToggleGroupPrimitive.Item>
        ))}
      </ToggleGroupPrimitive.Root>
      <span>{t(`settings.accent.options.${accent}`)}</span>
    </div>
  );
}

function AccountLine({ session }: { session: Session }) {
  const { t } = useTranslation();
  return (
    <div className="border-hairline mb-8 flex items-center gap-3 border-b pb-5">
      <Vinyl initial={toInitials(session.fullName)} size="md" />
      <span className="min-w-0">
        <b className="block truncate text-[0.9375rem]">{session.fullName}</b>
        <small className="text-ink-3 block truncate text-[0.8125rem]">{session.email}</small>
      </span>
      <span className="bg-fill-on rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold">
        {t(`user.accessType.${session.accessType}`)}
      </span>
      <Button asChild variant="ghost" size="sm" className="ml-auto">
        <Link to="/account">
          {t('user.account')}
          <ChevronRight />
        </Link>
      </Button>
    </div>
  );
}

function SongsGroup() {
  const { t } = useTranslation();
  const [lyricsSize, setLyricsSize] = useLyricsSize();
  const [notation, setNotation] = useChordNotation();
  const [chordStyle, setChordStyle] = useChordStyle();
  const [accidentals, setAccidentals] = useAccidentals();
  const [colourChords, setColourChords] = useColourChords();

  return (
    <SettingsGroup
      id="settings-songs"
      title={t('settings.songs.title')}
      description={t('settings.songs.description')}
    >
      <SettingsRow
        label={t('settings.textSize.title')}
        hint={t('settings.textSize.hint', {
          size: t(`settings.textSize.options.${lyricsSize}`),
        })}
      >
        <Segmented
          value={lyricsSize}
          onChange={setLyricsSize}
          label={t('settings.textSize.title')}
          className={STRETCH}
          optionClassName="min-w-11 px-2.5"
          options={LYRICS_SIZES.map((value) => ({
            value,
            label: <span className={AA_SIZE_CLASSES[value]}>Aa</span>,
            ariaLabel: t(`settings.textSize.options.${value}`),
          }))}
        />
      </SettingsRow>
      <SettingsRow label={t('settings.font.title')}>
        <FontTiles />
      </SettingsRow>
      <SettingsRow label={t('reader.showChordsAs')} hint={t(`settings.notation.${notation}`)}>
        <Segmented<ChordNotation>
          mono
          value={notation}
          onChange={setNotation}
          label={t('reader.showChordsAs')}
          className={STRETCH}
          options={[
            { value: 'numbers', label: '1 4 5', ariaLabel: t('reader.numbers') },
            { value: 'letters', label: 'A B C', ariaLabel: t('reader.letters') },
          ]}
        />
      </SettingsRow>
      <SettingsRow label={t('reader.chordStyle')} hint={t(`settings.chordStyle.${chordStyle}`)}>
        <Segmented
          value={chordStyle}
          onChange={setChordStyle}
          label={t('reader.chordStyle')}
          className={STRETCH}
          options={CHORD_STYLES.map((value) => ({
            value,
            label: <SeventhLabel name={t(`reader.${value}`)} seventh={value === 'full'} />,
          }))}
        />
      </SettingsRow>
      <SettingsRow label={t('reader.accidentals')} hint={t(`settings.accidentals.${accidentals}`)}>
        <Segmented
          mono
          value={accidentals}
          onChange={setAccidentals}
          label={t('reader.accidentals')}
          className={STRETCH}
          options={ACCIDENTALS.map((value) => {
            const name = ACCIDENTAL_LABELS[value];
            return name === null
              ? { value, label: t('reader.auto') }
              : { value, label: name, ariaLabel: t(`reader.${value}`) };
          })}
        />
      </SettingsRow>
      <SettingsRow
        inline
        label={t('reader.colourChords')}
        hint={
          <span className="inline-flex items-center gap-2">
            <ColourDots />
            {t('settings.colourChords.hint')}
          </span>
        }
      >
        <Switch
          aria-label={t('reader.colourChords')}
          checked={colourChords === 'on'}
          onCheckedChange={(checked) => setColourChords(checked ? 'on' : 'off')}
        />
      </SettingsRow>
    </SettingsGroup>
  );
}

function PlayingGroup() {
  const { t } = useTranslation();
  const [speed, setSpeed] = useScrollSpeed();
  const [keepAwake, setKeepAwake] = useKeepAwake();

  return (
    <SettingsGroup
      id="settings-playing"
      title={t('settings.playing.title')}
      description={t('settings.playing.description')}
    >
      <SettingsRow label={t('reader.autoScroll.speed')} hint={t('settings.scrollSpeed.hint')}>
        <Segmented
          value={speed}
          onChange={setSpeed}
          label={t('reader.autoScroll.speed')}
          className={STRETCH}
          optionClassName="gap-2 px-3.5"
          options={AUTO_SCROLL_SPEEDS.map((value, index) => ({
            value,
            label: (
              <>
                <TempoIcon level={index + 1} />
                {t(`reader.autoScroll.${value}`)}
              </>
            ),
          }))}
        />
      </SettingsRow>
      <SettingsRow
        inline
        label={t('reader.keepAwake')}
        hint={wakeLockSupported() ? t('settings.keepAwake.hint') : t('reader.awakeOff')}
      >
        <Switch
          aria-label={t('reader.keepAwake')}
          checked={keepAwake === 'on'}
          onCheckedChange={(checked) => setKeepAwake(checked ? 'on' : 'off')}
        />
      </SettingsRow>
    </SettingsGroup>
  );
}

function LookGroup() {
  const { t } = useTranslation();
  const [glass, setGlass] = useGlassStyle();

  return (
    <SettingsGroup
      id="settings-look"
      title={t('settings.look.title')}
      description={t('settings.look.description')}
    >
      <SettingsRow label={t('theme.label')}>
        <ThemeChoice withIcons size="md" className={STRETCH} />
      </SettingsRow>
      <SettingsRow label={t('settings.accent.title')}>
        <AccentSwatches />
      </SettingsRow>
      {canRefract() ? (
        <SettingsRow label={t('settings.glass.title')} hint={t('settings.glass.hint')}>
          <Segmented
            value={glass}
            onChange={setGlass}
            label={t('settings.glass.title')}
            className={STRETCH}
            options={GLASS_STYLES.map((value) => ({
              value,
              label: t(`settings.glass.options.${value}`),
            }))}
          />
        </SettingsRow>
      ) : null}
      <SettingsRow label={t('language.label')}>
        <LanguageChoice size="md" className={STRETCH} />
      </SettingsRow>
    </SettingsGroup>
  );
}

// What you set once, saved on this device, with a live preview of how songs will read.
export function SettingsPage({ session }: { session: Session }) {
  const { t } = useTranslation();
  const isRoomy = useIsRoomy();
  const signOut = useSignOut();

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <AccountLine session={session} />
      <div
        className={cn(
          'grid items-start gap-12',
          isRoomy && 'grid-cols-[minmax(0,640px)_minmax(320px,400px)]'
        )}
      >
        <div className="grid min-w-0 gap-9">
          {isRoomy ? null : <SettingsPreview compact />}
          <SongsGroup />
          <PlayingGroup />
          <LookGroup />
          <footer className="border-hairline flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t pt-5">
            <p className="text-ink-3 max-w-[40ch] text-[0.8125rem] leading-[1.45]">
              {t('settings.foot')}
            </p>
            <Button variant="exit" className="h-10 px-4" onClick={() => void signOut()}>
              <Logout />
              {t('user.signOut')}
            </Button>
          </footer>
        </div>
        {isRoomy ? (
          <div className="sticky top-6">
            <p className="text-ink-3 mb-2.5 text-xs font-semibold">{t('settings.preview.label')}</p>
            <SettingsPreview />
            <p className="text-ink-3 mt-3 text-[0.8125rem]">{t('settings.preview.note')}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
