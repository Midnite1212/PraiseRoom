import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { nextSetlistId, type SetStatus, setStatus } from '@/components/primitives/set-status';
import { Button } from '@/components/ui/button';
import { dateLocale } from '@/lib/date-locale';
import { cn } from '@/lib/utils';

import type { SetlistSummary } from './api';
import { toDateInputValue, weekdayLabels } from './format-date';
import { dayLinkHandlers, useSetlistList } from './setlist-list-context';

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

const DOT_CLASSES: Partial<Record<SetStatus, string>> = {
  next: 'after:bg-pixel-on after:shadow-[0_0_6px_var(--pixel-glow)]',
  up: 'after:bg-ink/40',
  past: 'after:bg-ink/70',
};

const LEGEND = [
  { status: 'next', labelKey: 'setlists.calendar.next' },
  { status: 'up', labelKey: 'setlists.calendar.later' },
  { status: 'past', labelKey: 'setlists.calendar.played' },
] as const;

// A day shows the status of its next set, else of its first.
const dayStatus = (statuses: readonly SetStatus[]): SetStatus =>
  statuses.find((status) => status === 'next') ?? statuses[0] ?? 'undated';

// Wide screens: a compact month in the side column, a dot on each day that has a setlist coloured
// by its status. Choosing a day shows only that day's setlists; choosing it again clears it.
export function SetlistCalendar({ setlists, now, day, onDayChange }: SetlistCalendarProps) {
  const { t, i18n } = useTranslation();
  const today = new Date(now);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const lead = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toDateInputValue(today.toISOString());
  const list = useSetlistList();
  const nextId = nextSetlistId(setlists, now);

  const setsByDay = new Map<string, { names: string[]; statuses: SetStatus[] }>();
  for (const setlist of setlists) {
    const key = toDateInputValue(setlist.date);
    if (!key) continue;
    const entry = setsByDay.get(key) ?? { names: [], statuses: [] };
    entry.names.push(setlist.name);
    entry.statuses.push(setStatus(setlist, nextId, now));
    setsByDay.set(key, entry);
  }

  // Monday first; 2024-01-01 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2024, 0, 1 + index);
    return {
      key: date.getDay(),
      label: new Intl.DateTimeFormat(dateLocale(i18n.language), { weekday: 'narrow' }).format(date),
    };
  });
  const weekdays = weekdayLabels(i18n.language);
  const dayLabel = (date: Date) =>
    new Intl.DateTimeFormat(dateLocale(i18n.language), { day: 'numeric', month: 'long' }).format(
      date
    );

  const cellClasses =
    'relative grid h-[34px] place-items-center rounded-[10px] font-mono text-[0.8125rem] font-semibold';

  return (
    <section
      aria-label={t('setlists.calendar.label')}
      className="glass px-2.5 pt-3 pb-2.5 [--glass-r:24px]"
    >
      <div className="mb-1 ml-1.5 flex items-center justify-between">
        <b className="font-semibold">
          {new Intl.DateTimeFormat(dateLocale(i18n.language), {
            month: 'long',
            year: 'numeric',
          }).format(month)}
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
      <div className="grid grid-cols-7 text-center">
        {weekdays.map((weekday) => (
          <span
            key={weekday.key}
            aria-hidden
            className="text-ink-3 py-0.5 text-[0.6875rem] font-semibold"
          >
            {weekday.label}
          </span>
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(year, monthIndex, index + 1);
          const key = `${year}-${pad(monthIndex + 1)}-${pad(index + 1)}`;
          const sets = setsByDay.get(key);
          const isToday = key === todayKey;
          const column = index === 0 ? FIRST_COLUMN[lead] : undefined;
          if (!sets) {
            return (
              <span
                key={key}
                className={cn(
                  cellClasses,
                  column,
                  'text-ink-2',
                  isToday && 'bg-fill-hover text-ink shadow-[inset_0_0_0_1px_var(--ink-3)]'
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
              aria-label={`${dayLabel(date)}: ${sets.names.join(', ')}`}
              title={sets.names.join(', ')}
              onClick={() => onDayChange(day === key ? undefined : key)}
              {...dayLinkHandlers(list, key)}
              className={cn(
                cellClasses,
                column,
                'text-ink hover:liquid-hover aria-pressed:liquid-on aria-pressed:hover:liquid-on after:absolute after:bottom-[5px] after:size-1',
                DOT_CLASSES[dayStatus(sets.statuses)],
                isToday && 'bg-fill-hover shadow-[inset_0_0_0_1px_var(--ink-3)]',
                list.litDay === key && 'liquid-on'
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <p className="border-hairline text-ink-3 mx-1 mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1 border-t pt-2 text-xs">
        {day ? (
          <>
            {t('setlists.calendar.showing', {
              day: new Intl.DateTimeFormat(dateLocale(i18n.language), {
                day: 'numeric',
                month: 'short',
              }).format(new Date(`${day}T00:00:00`)),
            })}
            <span aria-hidden>·</span>
            <Button variant="link" size="xs" onClick={() => onDayChange(undefined)}>
              {t('setlists.calendar.showAll')}
            </Button>
          </>
        ) : (
          LEGEND.map(({ status, labelKey }) => (
            <span key={status} className="mr-2 inline-flex items-center gap-1.5 last:mr-0">
              <i
                aria-hidden
                className={cn(
                  'size-1.5 flex-none',
                  status === 'next' && 'bg-pixel-on',
                  status === 'up' && 'bg-ink/40',
                  status === 'past' && 'bg-ink/70'
                )}
              />
              {t(labelKey)}
            </span>
          ))
        )}
      </p>
    </section>
  );
}
