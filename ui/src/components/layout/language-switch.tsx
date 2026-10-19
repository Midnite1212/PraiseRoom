import { Languages } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { changeLanguage, LANGUAGES, type LanguageCode } from '@/i18n';

const isLanguageCode = (value: string): value is LanguageCode =>
  LANGUAGES.some(({ code }) => code === value);

const handleLanguageChange = (value: string) => {
  if (isLanguageCode(value)) void changeLanguage(value);
};

export function LanguageSwitch() {
  const { t, i18n } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('language.label')}>
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={i18n.language} onValueChange={handleLanguageChange}>
          {LANGUAGES.map(({ code, label }) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
