import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Close } from 'pixelarticons/react';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { nextSetlistId, setStatus } from '@/components/primitives/set-status';
import { Tray } from '@/components/primitives/tray';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Session } from '@/features/auth/session';
import { dateLocale } from '@/lib/date-locale';
import { cn } from '@/lib/utils';

import { type AddTarget, addTargets } from './add-targets';
import { type SetlistSummary, setlistsQueryOptions, setSetlistSongs } from './api';

type AddSong = { _id: string; title: string };

function TargetRow({
  target,
  isNext,
  now,
  disabled,
  onPick,
}: {
  target: AddTarget;
  isNext: boolean;
  now: Date;
  disabled: boolean;
  onPick: (setlist: SetlistSummary) => void;
}) {
  const { t, i18n } = useTranslation();
  const { setlist, hasSong } = target;
  const date = setlist.date
    ? new Intl.DateTimeFormat(dateLocale(i18n.language), {
        day: 'numeric',
        month: 'short',
      }).format(new Date(setlist.date))
    : t('setlists.noDate');
  const status = setStatus(setlist, isNext ? setlist._id : null, now.getTime());

  return (
    <li>
      <button
        type="button"
        disabled={disabled || hasSong}
        onClick={() => onPick(setlist)}
        className="enabled:hover:bg-fill-hover grid min-h-12 w-full grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-2xl px-2.5 py-1.5 text-left transition-colors duration-150 ease-out disabled:opacity-60"
      >
        <i
          aria-hidden
          className={cn(
            'size-2.5',
            status === 'next' ? 'bg-pixel-on shadow-[0_0_6px_var(--pixel-glow)]' : 'bg-pixel-off'
          )}
        />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{setlist.name}</span>
          {hasSong ? (
            <small className="text-ink-3 flex items-center gap-1 text-xs font-semibold">
              <Check className="size-3" />
              {t('addToSetlist.alreadyIn')}
            </small>
          ) : null}
        </span>
        <span className="text-ink-2 text-[0.8125rem]">{date}</span>
      </button>
    </li>
  );
}

function TargetList({
  song,
  session,
  close,
}: {
  song: AddSong;
  session: Session;
  close: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [now] = useState(() => new Date());
  const { data, isPending, isError } = useQuery(setlistsQueryOptions());

  const add = useMutation({
    mutationFn: (setlist: SetlistSummary) =>
      setSetlistSongs(setlist._id, [...setlist.songs.map(({ _id }) => _id), song._id]),
    onSuccess: async (_saved, setlist) => {
      await queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success(t('addToSetlist.added', { name: setlist.name }));
      close();
    },
    onError: () => {
      toast.error(t('addToSetlist.failed'));
    },
  });

  if (isPending)
    return (
      <div className="grid gap-1.5">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    );
  if (isError) return <p className="text-ink-2 py-3 text-sm">{t('addToSetlist.loadFailed')}</p>;

  const targets = addTargets(data, session, song._id, now);
  if (targets.length === 0)
    return <p className="text-ink-2 py-3 text-sm">{t('addToSetlist.empty')}</p>;
  const nextId = nextSetlistId(data, now.getTime());

  return (
    <ol className="m-0 max-h-[min(50svh,360px)] list-none overflow-y-auto p-0">
      {targets.map((target) => (
        <TargetRow
          key={target.setlist._id}
          target={target}
          isNext={target.setlist._id === nextId}
          now={now}
          disabled={add.isPending}
          onPick={(setlist) => add.mutate(setlist)}
        />
      ))}
    </ol>
  );
}

// Add a song to one of your upcoming or undated setlists: a tray listing the ones you can edit.
export function AddToSetlist({
  song,
  session,
  trigger,
}: {
  song: AddSong;
  session: Session;
  trigger: ReactElement;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tray trigger={trigger} title={t('addToSetlist.title')} open={isOpen} onOpenChange={setIsOpen}>
      <div className="mb-3 flex items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h2 className="m-0 text-base leading-[1.3] font-semibold">{t('addToSetlist.title')}</h2>
          <p className="text-ink-2 m-0 mt-0.5 truncate text-[0.8125rem]">{song.title}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('addToSetlist.close')}
          onClick={() => setIsOpen(false)}
        >
          <Close />
        </Button>
      </div>
      <TargetList song={song} session={session} close={() => setIsOpen(false)} />
    </Tray>
  );
}
