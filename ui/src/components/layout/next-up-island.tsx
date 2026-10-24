import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DateBlock } from '@/components/primitives/date-block';
import { nextSetlistId, whenLabel } from '@/components/primitives/set-status';
import { SetStrip } from '@/components/primitives/set-strip';
import {
  type SetlistSummary,
  setlistQueryOptions,
  setlistsQueryOptions,
  setlistSlug,
} from '@/features/setlists/api';
import { useCachedQueryData } from '@/hooks/use-cached-query-data';
import { dateLocale } from '@/lib/date-locale';
import { useRail } from '@/lib/rail';

// The rail's glass card for the next set, on every page except Home and Setlists, which lead with it.
export function NextUpIsland({ pathname }: { pathname: string }) {
  const setlists = useCachedQueryData(setlistsQueryOptions().queryKey);
  const [now] = useState(Date.now);
  if (pathname === '/' || pathname.startsWith('/setlists') || !setlists) return null;
  const nextId = nextSetlistId(setlists, now);
  const next = setlists.find((setlist) => setlist._id === nextId);
  return next ? <NextUpCard setlist={next} now={now} /> : null;
}

function NextUpCard({ setlist, now }: { setlist: SetlistSummary; now: number }) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [rail] = useRail();
  const detail = useCachedQueryData(setlistQueryOptions(setlist.urlKey).queryKey);
  useEffect(() => {
    void queryClient.prefetchQuery(setlistQueryOptions(setlist.urlKey));
  }, [queryClient, setlist.urlKey]);
  const when = setlist.date ? whenLabel(setlist.date, now, i18n.language) : '';
  const day = setlist.date
    ? new Intl.DateTimeFormat(dateLocale(i18n.language), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(setlist.date))
    : '';

  return (
    <Link
      to="/setlists/$setlistSlug"
      params={{ setlistSlug: setlistSlug(setlist) }}
      aria-label={t('nav.nextUpLabel', { name: setlist.name, day })}
      title={rail === 'folded' ? setlist.name : undefined}
      className="glass grid gap-1 p-3 text-left [--glass-r:24px] group-data-[rail=folded]/rail:justify-items-center group-data-[rail=folded]/rail:p-2"
    >
      <span className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 group-data-[rail=folded]/rail:grid-cols-[44px]">
        <DateBlock date={setlist.date} status="next" size="sm" />
        <span className="min-w-0 group-data-[rail=folded]/rail:hidden">
          <b className="block truncate text-sm">{setlist.name}</b>
          <small className="text-ink-3 block text-xs">{t('nav.nextUpWhen', { when })}</small>
        </span>
      </span>
      {detail ? (
        <SetStrip
          status="next"
          titles={detail.songs.map((song) => song.title)}
          className="pl-14 group-data-[rail=folded]/rail:hidden"
        />
      ) : null}
    </Link>
  );
}
