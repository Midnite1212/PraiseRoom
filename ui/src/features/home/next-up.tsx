import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Folder, Link as LinkIcon, Play } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { DateBlock } from '@/components/primitives/date-block';
import { Tag } from '@/components/primitives/tag';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Session } from '@/features/auth/session';
import { keyForSong, type SetlistSummary, setlistQueryOptions } from '@/features/setlists/api';
import type { SetlistNames } from '@/features/setlists/setlist-row';
import { useSetlistActions } from '@/features/setlists/use-setlist-actions';

const DAY_MS = 86_400_000;

const daysUntil = (date: string, now: number): number => {
  const today = new Date(now);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const day = new Date(date);
  return Math.round(
    (new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() - start) / DAY_MS
  );
};

// The next setlist: the one glass card on Home, since it is what you came to open.
export function NextUp({
  session,
  setlist,
  names,
  now,
}: {
  session: Session;
  setlist: SetlistSummary;
  names: SetlistNames;
  now: number;
}) {
  const { t, i18n } = useTranslation();
  const { data: detail, isPending } = useQuery(setlistQueryOptions(setlist._id));
  const actions = useSetlistActions(session, setlist);
  const when = setlist.date
    ? new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' }).format(
        daysUntil(setlist.date, now),
        'day'
      )
    : null;
  const weekday = setlist.date
    ? new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(new Date(setlist.date))
    : null;

  return (
    <section aria-labelledby="next-up" className="glass p-[18px] [--glass-r:28px]">
      <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3.5">
        <DateBlock date={setlist.date} now={now} />
        <div className="min-w-0">
          <p className="text-chord mb-0.5 text-[0.8125rem] font-semibold">
            {when ? t('home.upNextWhen', { when }) : t('home.upNext')}
          </p>
          <h2 id="next-up" className="truncate text-[1.375rem] font-bold tracking-[-0.02em]">
            {setlist.name}
          </h2>
          <p className="text-ink-2 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem]">
            <span>
              {weekday ? `${weekday} · ` : null}
              {t('reader.songCount', { count: setlist.songs.length })}
            </span>
            {setlist.groupIds.flatMap((id) => {
              const name = names.folders.get(id);
              return name
                ? [
                    <Tag key={id}>
                      <Folder />
                      {name}
                    </Tag>,
                  ]
                : [];
            })}
          </p>
        </div>
      </div>
      {isPending ? (
        <Skeleton className="mt-4 h-36 w-full" />
      ) : detail && detail.songs.length > 0 ? (
        <ol className="mt-4 grid list-none gap-0.5 p-0">
          {detail.songs.map((song, index) => (
            <li
              key={song._id}
              className="bg-fill-hover grid min-h-9 grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl px-2.5 text-[0.9375rem]"
            >
              <span className="text-ink-3 font-mono text-[0.8125rem] font-semibold">
                {index + 1}
              </span>
              <span className="truncate">{song.title}</span>
              <span className="text-ink-2 font-mono text-[0.8125rem] font-semibold">
                {keyForSong(detail, song)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="mt-3.5 flex gap-2">
        <Button asChild>
          <Link to="/setlists/$setlistId" params={{ setlistId: setlist._id }}>
            <Play />
            {t('home.openSetlist')}
          </Link>
        </Button>
        {actions.canShare ? (
          <Button variant="secondary" onClick={actions.copyLink}>
            <LinkIcon />
            {t('setlists.share')}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
