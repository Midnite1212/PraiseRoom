// English dates read "Saturday 24 October", so English formats with en-GB; other languages are unchanged.
export const dateLocale = (language: string): string => (language === 'en' ? 'en-GB' : language);
