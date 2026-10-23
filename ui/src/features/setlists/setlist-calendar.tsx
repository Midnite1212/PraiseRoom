import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { SetlistSummary } from './api';
import { toDateInputValue } from './format-date';

type SetlistCalendarProps = {
  setlists: readonly SetlistSummary[];
  now: number;
  day: string | undefined;
  onDayChange: (day: string | undefined) => void;
};

const pad = (value: number) => String(value).padStart(2, '0');

// Where the month's first day sits in a Monday-first week.
const FIRST_COLUMN = [
  'col-start-1',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
] as const;

// Wide screens: a month beside the list, with a lit pixel on each day that has a setlist.
// Choosing a day shows only that day's setlists; choosing it again clears it.
export function SetlistCalendar({ setlists, now, day, onDayChange }: SetlistCalendarProps) {
  const { t, i18n } = useTranslation();
  const today = new Date(now);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const lead = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toDateInputValue(today.toISOString());

  const namesByDay = new Map<string, string[]>();
  for (const setlist of setlists) {
    const key = toDateInputValue(setlist.date);
    if (key) namesByDay.set(key, [...(namesByDay.get(key) ?? []), setlist.name]);
  }

  // Monday first; 2024-01-01 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2024, 0, 1 + index);
    return {
      key: date.getDay(),
      label: new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(date),
    };
  });
  const dayLabel = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(date);

  const cellClasses =
    'relative grid aspect-square place-items-center rounded-xl font-mono text-[0.8125rem] font-semibold';

  return (
    <section
      aria-label={t('setlists.calendar.label')}
      className="glass wide:block sticky top-7 hidden px-3 pt-3.5 pb-3 [--glass-r:24px]"
    >
      <div className="mb-2 ml-1.5 flex items-center justify-between">
        <b className="font-semibold">
          {new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(month)}
        </b>
        <span className="flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('setlists.calendar.previousMonth')}
            onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('setlists.calendar.nextMonth')}
            onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
          >
            <ChevronRight />
          </Button>
        </span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekdays.map((weekday) => (
          <span
            key={weekday.key}
            aria-hidden
            className="text-ink-3 py-1 text-[0.6875rem] font-semibold"
          >
            {weekday.label}
          </span>
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(year, monthIndex, index + 1);
          const key = `${year}-${pad(monthIndex + 1)}-${pad(index + 1)}`;
          const names = namesByDay.get(key);
          const isToday = key === todayKey;
          const column = index === 0 ? FIRST_COLUMN[lead] : undefined;
          if (!names) {
            return (
              <span
                key={key}
                className={cn(
                  cellClasses,
                  column,
                  'text-ink-2',
                  isToday && 'text-ink shadow-[inset_0_0_0_1px_var(--ink-3)]'
                )}
              >
                {index + 1}
              </span>
            );
          }
          return (
            <button
              key={key}
              type="button"
              aria-pressed={day === key}
              aria-label={`${dayLabel(date)}: ${names.join(', ')}`}
              title={names.join(', ')}
              onClick={() => onDayChange(day === key ? undefined : key)}
              className={cn(
                cellClasses,
                column,
                'text-ink hover:bg-fill-hover aria-pressed:bg-fill-on after:bg-pixel-on after:absolute after:bottom-[5px] after:size-1',
                isToday && 'shadow-[inset_0_0_0_1px_var(--ink-3)]'
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <p className="border-hairline text-ink-3 mx-1.5 mt-2.5 flex items-center gap-2 border-t pt-2.5 text-xs">
        <i aria-hidden className="bg-pixel-on size-1 flex-none" />
        {day
          ? t('setlists.calendar.showing', {
              day: new Intl.DateTimeFormat(i18n.language, {
                day: 'numeric',
                month: 'short',
              }).format(new Date(`${day}T00:00:00`)),
            })
          : t('setlists.calendar.hint')}
      </p>
    </section>
  );
}
