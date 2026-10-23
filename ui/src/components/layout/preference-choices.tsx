import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/primitives/segmented';
import { changeLanguage, LANGUAGES, type LanguageCode } from '@/i18n';

const THEMES = ['light', 'system', 'dark'] as const;
type Theme = (typeof THEMES)[number];

const isTheme = (value: string | undefined): value is Theme =>
  THEMES.some((theme) => theme === value);

type ChoiceProps = { size?: 'sm' | 'md' | 'lg'; fullWidth?: boolean };

// Light · System · Dark for this device.
export function ThemeChoice({ size = 'sm', fullWidth = false }: ChoiceProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  return (
    <Segmented
      value={isTheme(theme) ? theme : 'system'}
      onChange={setTheme}
      label={t('theme.label')}
      size={size}
      fullWidth={fullWidth}
      options={THEMES.map((value) => ({ value, label: t(`theme.${value}`) }))}
    />
  );
}

// English · 繁體中文, each named in its own language.
export function LanguageChoice({ size = 'sm', fullWidth = false }: ChoiceProps) {
  const { t, i18n } = useTranslation();
  const language = LANGUAGES.find(({ code }) => code === i18n.language)?.code ?? 'en';
  return (
    <Segmented<LanguageCode>
      value={language}
      onChange={(code) => void changeLanguage(code)}
      label={t('language.label')}
      size={size}
      fullWidth={fullWidth}
      options={LANGUAGES.map(({ code, label }) => ({ value: code, label, lang: code }))}
    />
  );
}
