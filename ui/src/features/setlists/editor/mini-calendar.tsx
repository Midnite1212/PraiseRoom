import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { weekdayLabels } from '../format-date';

type MiniCalendarProps = {
  // The picked day as `YYYY-MM-DD`, or '' for none.
  value: string;
  // Today as `YYYY-MM-DD`; also the month shown when nothing is picked.
  today: string;
  onChange: (day: string) => void;
};

const pad = (value: number) => String(value).padStart(2, '0');

const monthOf = (day: string) => {
  const [year = 1970, month = 1] = day.split('-').map(Number);
  return { year, month: month - 1 };
};

// One month with a day to pick, Monday first; the picked day is filled and today is ringed.
export function MiniCalendar({ value, today, onChange }: MiniCalendarProps) {
  const { t, i18n } = useTranslation();
  const [shown, setShown] = useState(() => monthOf(value || today));
  const first = new Date(shown.year, shown.month, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(shown.year, shown.month + 1, 0).getDate();
  const move = (step: number) => {
    const next = new Date(shown.year, shown.month + step, 1);
    setShown({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <div>
      <div className="mb-1 ml-1.5 flex items-center justify-between">
        <b aria-live="polite" className="font-semibold">
          {new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(first)}
        </b>
        <span className="flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('setlists.calendar.previousMonth')}
            onClick={() => move(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('setlists.calendar.nextMonth')}
            onClick={() => move(1)}
          >
            <ChevronRight />
          </Button>
        </span>
      </div>
      <div className="grid grid-cols-7 text-center">
        {weekdayLabels(i18n.language).map((weekday) => (
          <span
            key={weekday.key}
            aria-hidden
            className="text-ink-3 py-0.5 text-[0.6875rem] font-semibold"
          >
            {weekday.label}
          </span>
        ))}
        {Array.from({ length: lead }, (_, index) => (
          // Blank cells before the 1st only push the days into their weekday column.
          // oxlint-disable-next-line react/no-array-index-key
          <span key={index} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = `${shown.year}-${pad(shown.month + 1)}-${pad(index + 1)}`;
          const isPicked = day === value;
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isPicked}
              aria-label={new Intl.DateTimeFormat(i18n.language, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date(shown.year, shown.month, index + 1))}
              onClick={() => onChange(day)}
              className={cn(
                'text-ink hover:bg-fill-hover grid h-[34px] place-items-center rounded-[10px] font-mono text-[0.8125rem] font-semibold transition-colors',
                day === today && 'shadow-[inset_0_0_0_1px_var(--ink-3)]',
                isPicked && 'bg-chord text-ground hover:bg-chord'
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
