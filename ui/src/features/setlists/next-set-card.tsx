import { Link } from '@tanstack/react-router';
import { Link as LinkIcon } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { DateBlock } from '@/components/primitives/date-block';
import { whenLabel } from '@/components/primitives/set-status';
import { SetStrip } from '@/components/primitives/set-strip';
import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import { dateLocale } from '@/lib/date-locale';

import type { SetlistSummary } from './api';
import { useSetlistActions } from './use-setlist-actions';

// The next setlist, as a short glass card that leads the phone list: the whole card opens it and
// sharing sits in its corner.
export function NextSetCard({
  session,
  setlist,
  now,
}: {
  session: Session;
  setlist: SetlistSummary;
  now: number;
}) {
  const { t, i18n } = useTranslation();
  const actions = useSetlistActions(session, setlist);
  const parts = [
    setlist.date
      ? new Intl.DateTimeFormat(dateLocale(i18n.language), { weekday: 'long' }).format(
          new Date(setlist.date)
        )
      : null,
    setlist.date ? whenLabel(setlist.date, now, i18n.language) : null,
    t('reader.songCount', { count: setlist.songs.length }),
  ].filter((part) => part !== null);

  return (
    <section
      aria-labelledby="next-set"
      className="glass focus-within:outline-chord relative mt-2 p-[18px] [--glass-r:28px] focus-within:outline-2 focus-within:outline-offset-[3px]"
    >
      <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3.5">
        <DateBlock date={setlist.date} status="up" />
        <div className="min-w-0">
          <h2 id="next-set" className="text-card-title m-0 font-bold tracking-[-0.02em]">
            <Link
              to="/setlists/$setlistId"
              params={{ setlistId: setlist._id }}
              className="block truncate outline-none after:absolute after:inset-0 after:z-[1] after:rounded-[28px]"
            >
              {setlist.name}
            </Link>
          </h2>
          <p className="text-ink-2 mt-1 truncate text-sm">{parts.join(' · ')}</p>
        </div>
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
        ) : null}
      </div>
      <SetStrip status="next" titles={setlist.songs.map((song) => song.title)} className="mt-4" />
    </section>
  );
}
