import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Link as LinkIcon } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { DateBlock } from '@/components/primitives/date-block';
import { whenLabel } from '@/components/primitives/set-status';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Session } from '@/features/auth/session';
import { keyForSong, type SetlistSummary, setlistQueryOptions } from '@/features/setlists/api';
import { useSetlistActions } from '@/features/setlists/use-setlist-actions';

// The next setlist: the one glass card on Home. The whole card opens it, sharing sits in its
// corner, and the songs are listed with the key each is played in.
export function NextUp({
  session,
  setlist,
  now,
}: {
  session: Session;
  setlist: SetlistSummary;
  now: number;
}) {
  const { t, i18n } = useTranslation();
  const { data: detail, isPending } = useQuery(setlistQueryOptions(setlist._id));
  const actions = useSetlistActions(session, setlist);
  const meta = [
    setlist.date
      ? new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(new Date(setlist.date))
      : null,
    setlist.date ? whenLabel(setlist.date, now, i18n.language) : null,
    t('reader.songCount', { count: setlist.songs.length }),
  ].filter((part) => part !== null);

  return (
    <section
      aria-labelledby="next-up"
      className="glass ease-liquid focus-within:outline-chord wide:mt-0 group/next relative mt-2 p-[18px] transition-transform duration-[420ms] [--glass-r:28px] focus-within:outline-2 focus-within:outline-offset-[3px] has-[a:hover]:-translate-y-0.5 has-[a:hover]:[--glass-fill:var(--glass-tint-over)]"
    >
      <div className="grid grid-cols-[52px_minmax(0,1fr)_auto_auto] items-center gap-3.5">
        <DateBlock date={setlist.date} status="next" />
        <div className="min-w-0">
          <h2 id="next-up" className="m-0 text-[1.375rem] font-bold tracking-[-0.02em]">
            <Link
              to="/setlists/$setlistId"
              params={{ setlistId: setlist._id }}
              className="block truncate outline-none after:absolute after:inset-0 after:z-[1] after:rounded-[28px]"
            >
              {setlist.name}
            </Link>
          </h2>
          <p className="text-ink-2 mt-1 truncate text-sm">{meta.join(' · ')}</p>
        </div>
        <span
          aria-hidden
          className="text-ink-2 wide:inline-flex hidden h-9 -translate-x-1.5 items-center gap-1 self-start text-[0.8125rem] font-semibold opacity-0 transition-[opacity,transform] duration-300 ease-out group-has-[a:focus-visible]/next:translate-x-0 group-has-[a:focus-visible]/next:opacity-100 group-has-[a:hover]/next:translate-x-0 group-has-[a:hover]/next:opacity-100"
        >
          {t('home.open')}
          <ArrowRight />
        </span>
        {actions.canShare ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={actions.copyLink}
            aria-label={t('reader.copyLink')}
            title={t('reader.copyLink')}
            className="relative z-[2] -mt-1 -mr-1.5 self-start"
          >
            <LinkIcon />
          </Button>
        ) : (
          <span />
        )}
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
    </section>
  );
}
