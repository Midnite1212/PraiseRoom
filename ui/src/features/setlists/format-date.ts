export const formatSetlistDate = (
  date: string | null | undefined,
  language: string
): string | null => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};
