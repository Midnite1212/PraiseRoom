const UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'day', ms: 86_400_000 },
  { unit: 'hour', ms: 3_600_000 },
  { unit: 'minute', ms: 60_000 },
];

// "2 days ago", "3 hours ago", or `justNow` under a minute; `locale` is an Intl locale such as en-GB.
export const formatRelative = (
  iso: string,
  now: number,
  locale: string,
  justNow: string
): string => {
  const elapsed = now - new Date(iso).getTime();
  if (!Number.isFinite(elapsed)) return justNow;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const { unit, ms } of UNITS) {
    if (elapsed >= ms) return format.format(-Math.floor(elapsed / ms), unit);
  }
  return justNow;
};
