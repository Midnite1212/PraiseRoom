import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zhHant from './locales/zh-Hant.json';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-Hant', label: '繁體中文' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const resources = {
  en: { translation: en },
  'zh-Hant': { translation: zhHant },
} as const;

const LANGUAGE_STORAGE_KEY = 'language';

const isLanguageCode = (value: unknown): value is LanguageCode =>
  LANGUAGES.some(({ code }) => code === value);

const readStoredLanguage = (): string | null => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
};

const detectLanguage = (): LanguageCode => {
  const stored = readStoredLanguage();
  if (isLanguageCode(stored)) return stored;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-Hant' : 'en';
};

export const changeLanguage = async (language: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(language);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Private mode or blocked storage: the choice lasts for this visit only.
  }
};

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
