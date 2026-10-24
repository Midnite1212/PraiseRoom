import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/primitives/segmented';
import { changeLanguage, LANGUAGES, type LanguageCode } from '@/i18n';

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
