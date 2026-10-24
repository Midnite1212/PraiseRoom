import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageChoice, ThemeChoice } from '@/components/layout/preference-choices';
import { PageHeader } from '@/components/page/page-header';
import { LYRICS_SIZES, useLyricsSize } from '@/features/reader/lyrics-size';
import { ACCENTS, useAccent } from '@/lib/accent';
import { canRefract, GLASS_STYLES, useGlassStyle } from '@/lib/liquid-glass';
import { TYPEFACES, useTypeface } from '@/lib/typeface';
import { cn } from '@/lib/utils';

function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <div className="px-1">
        <h2 id={id} className="text-ui font-semibold">
          {title}
        </h2>
        <p className="text-ink-2 text-[0.8125rem]">{description}</p>
      </div>
      {children}
    </section>
  );
}

type Tile<T extends string> = {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
  attributes?: Record<`data-${string}`, string>;
};

// One choice from several, shown as tiles that preview what they choose.
function ChoiceTiles<T extends string>({
  value,
  tiles,
  onChange,
  label,
  className,
  tileClassName,
}: {
  value: T;
  tiles: readonly Tile<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
  tileClassName?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        const tile = tiles.find((candidate) => candidate.value === next);
        if (tile) onChange(tile.value);
      }}
      aria-label={label}
      className={cn('grid gap-1.5', className)}
    >
      {tiles.map((tile) => (
        <ToggleGroupPrimitive.Item
          key={tile.value}
          value={tile.value}
          aria-label={tile.ariaLabel}
          {...tile.attributes}
          className={cn(
            'bg-fill-hover hover:liquid-hover data-[state=on]:liquid-on data-[state=on]:hover:liquid-on rounded-2xl text-left transition-colors',
            tileClassName
          )}
        >
          {tile.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const [typeface, setTypeface] = useTypeface();
  const [lyricsSize, setLyricsSize] = useLyricsSize();
  const [accent, setAccent] = useAccent();
  const [glass, setGlass] = useGlassStyle();

  return (
    <>
      <PageHeader title={t('settings.title')} description={t('settings.description')} />
      <div className="flex max-w-2xl flex-col gap-7">
        <SettingsSection
          id="settings-language"
          title={t('language.label')}
          description={t('settings.language.description')}
        >
          <LanguageChoice size="lg" fullWidth />
        </SettingsSection>

        <SettingsSection
          id="settings-theme"
          title={t('theme.label')}
          description={t('settings.theme.description')}
        >
          <ThemeChoice size="lg" fullWidth />
        </SettingsSection>

        <SettingsSection
          id="settings-accent"
          title={t('settings.accent.title')}
          description={t('settings.accent.description')}
        >
          <ChoiceTiles
            value={accent}
            onChange={setAccent}
            label={t('settings.accent.title')}
            className="wide:grid-cols-4 grid-cols-2"
            tileClassName="flex items-center gap-2.5 px-3.5 py-3 text-sm font-semibold"
            tiles={ACCENTS.map((value) => ({
              value,
              label: (
                <>
                  <span
                    aria-hidden
                    data-palette={value}
                    className="bg-brand size-4 flex-none rounded-full shadow-[inset_0_0_0_1px_var(--hairline)]"
                  />
                  {t(`settings.accent.options.${value}`)}
                </>
              ),
            }))}
          />
        </SettingsSection>

        {canRefract() ? (
          <SettingsSection
            id="settings-glass"
            title={t('settings.glass.title')}
            description={t('settings.glass.description')}
          >
            <ChoiceTiles
              value={glass}
              onChange={setGlass}
              label={t('settings.glass.title')}
              className="grid-cols-2"
              tileClassName="px-3.5 py-3 text-sm font-semibold"
              tiles={GLASS_STYLES.map((value) => ({
                value,
                label: t(`settings.glass.options.${value}`),
              }))}
            />
          </SettingsSection>
        ) : null}

        <SettingsSection
          id="settings-font"
          title={t('settings.font.title')}
          description={t('settings.font.description')}
        >
          <ChoiceTiles
            value={typeface}
            onChange={setTypeface}
            label={t('settings.font.title')}
            className="wide:grid-cols-2 grid-cols-1"
            tileClassName="flex flex-col gap-1 px-4 py-3 font-sans"
            tiles={TYPEFACES.map((value) => ({
              value,
              attributes: { 'data-typeface': value },
              label: (
                <>
                  <span className="text-base font-semibold">
                    {t(`settings.font.options.${value}`)}
                  </span>
                  <span className="text-ink-2 text-sm">{t('settings.font.sample')}</span>
                </>
              ),
            }))}
          />
        </SettingsSection>

        <SettingsSection
          id="settings-text-size"
          title={t('settings.textSize.title')}
          description={t('settings.textSize.description')}
        >
          <ChoiceTiles
            value={lyricsSize}
            onChange={setLyricsSize}
            label={t('settings.textSize.title')}
            className="grid-cols-5"
            tileClassName="font-lyrics text-lyrics grid h-14 place-items-center text-center"
            tiles={LYRICS_SIZES.map((value) => ({
              value,
              ariaLabel: t(`settings.textSize.options.${value}`),
              attributes: { 'data-lyrics-size': value },
              label: 'Aa',
            }))}
          />
          <p
            data-lyrics-size={lyricsSize}
            className="bg-fill-hover font-lyrics text-lyrics rounded-2xl p-4"
          >
            {t('settings.textSize.preview')}
          </p>
        </SettingsSection>
      </div>
    </>
  );
}
