export type SetStatus = 'next' | 'up' | 'past' | 'undated';

type Dated = { _id: string; date?: string | null };

const DAY_MS = 86_400_000;

const dayStart = (time: number): number => {
  const day = new Date(time);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
};

const timeOf = (date: string | null | undefined): number | null => {
  if (!date) return null;
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? null : time;
};

// The soonest setlist dated today or later.
export const nextSetlistId = (setlists: readonly Dated[], now: number): string | null => {
  const today = dayStart(now);
  let nextId: string | null = null;
  let nextTime = Infinity;
  for (const setlist of setlists) {
    const time = timeOf(setlist.date);
    if (time !== null && time >= today && time < nextTime) {
      nextId = setlist._id;
      nextTime = time;
    }
  }
  return nextId;
};

export const setStatus = (setlist: Dated, nextId: string | null, now: number): SetStatus => {
  const time = timeOf(setlist.date);
  if (time === null) return 'undated';
  if (time < dayStart(now)) return 'past';
  return setlist._id === nextId ? 'next' : 'up';
};

// Whole calendar days from today to the date; negative once it has passed.
export const daysFrom = (date: string, now: number): number => {
  const time = timeOf(date);
  return time === null ? 0 : Math.round((dayStart(time) - dayStart(now)) / DAY_MS);
};

// "today", "tomorrow", "in 3 days" or "3 days ago" in the given language.
export const whenLabel = (date: string, now: number, language: string): string =>
  new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(daysFrom(date, now), 'day');
