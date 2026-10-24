import { dateLocale } from '@/lib/date-locale';

export const formatSetlistDate = (
  date: string | null | undefined,
  language: string
): string | null => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(dateLocale(language), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const pad = (value: number) => String(value).padStart(2, '0');

// `<input type="date">` works in local calendar days; the API stores local midnight as an ISO instant.
export const toDateInputValue = (date: string | null | undefined): string => {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

export const fromDateInputValue = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
