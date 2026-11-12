import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'pixelarticons/react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/primitives/segmented';
import { changeLanguage, LANGUAGES, type LanguageCode } from '@/i18n';
import { ACCENTS, useAccent } from '@/lib/accent';

const THEMES = ['light', 'system', 'dark'] as const;
type Theme = (typeof THEMES)[number];

const isTheme = (value: string | undefined): value is Theme =>
  THEMES.some((theme) => theme === value);

const THEME_ICONS = { light: Sun, system: Monitor, dark: Moon } as const;

const COMPACT_LANGUAGE_LABELS: Record<LanguageCode, string> = { en: 'EN', 'zh-Hant': '繁' };

type ChoiceProps = {
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  compact?: boolean;
  className?: string;
};

// Light · System · Dark for this device; compact shows icons only, `withIcons` an icon before each name.
export function ThemeChoice({
  size = 'sm',
  fullWidth = false,
  compact = false,
  withIcons = false,
  className,
}: ChoiceProps & { withIcons?: boolean }) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  return (
    <Segmented
      value={isTheme(theme) ? theme : 'system'}
      onChange={setTheme}
      label={t('theme.label')}
      size={size}
      fullWidth={fullWidth}
      className={className}
      optionClassName={compact ? 'w-11 px-0' : undefined}
      options={THEMES.map((value) => {
        const Icon = THEME_ICONS[value];
        if (withIcons) {
          return {
            value,
            label: (
              <>
                <Icon />
                {t(value === 'system' ? 'theme.auto' : `theme.${value}`)}
              </>
            ),
            ariaLabel: value === 'system' ? t('theme.matchDevice') : undefined,
          };
        }
        const name = value === 'system' && compact ? t('theme.matchDevice') : t(`theme.${value}`);
        return compact ? { value, label: <Icon />, ariaLabel: name } : { value, label: name };
      })}
    />
  );
}

// English · 繁體中文, each named in its own language; compact shows EN · 繁.
export function LanguageChoice({
  size = 'sm',
  fullWidth = false,
  compact = false,
  className,
}: ChoiceProps) {
  const { t, i18n } = useTranslation();
  const language = LANGUAGES.find(({ code }) => code === i18n.language)?.code ?? 'en';
  return (
    <Segmented<LanguageCode>
      value={language}
      onChange={(code) => void changeLanguage(code)}
      label={t('language.label')}
      size={size}
      fullWidth={fullWidth}
      className={className}
      optionClassName={compact ? 'w-11 px-0' : undefined}
      options={LANGUAGES.map(({ code, label }) => ({
        value: code,
        label: compact ? COMPACT_LANGUAGE_LABELS[code] : label,
        ariaLabel: compact ? label : undefined,
        lang: code,
      }))}
    />
  );
}

export function AccentChoice({ showName = true }: { showName?: boolean }) {
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
      {showName ? <span>{t(`settings.accent.options.${accent}`)}</span> : null}
    </div>
  );
}
