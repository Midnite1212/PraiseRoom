import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Check, ChevronRight } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { LIST_CLASSES, listRowClasses, RowText } from '@/components/page/list-row';
import type { Session } from '@/features/auth/session';
import { setlistsQueryOptions } from '@/features/setlists/api';
import { cn } from '@/lib/utils';

import {
  type GettingStartedProgress,
  type GettingStartedStep,
  gettingStartedProgress,
} from './steps';
import { useStoredGettingStarted } from './store';

const STEP_LINKS = {
  openSong: '/songs',
  changeKey: '/songs',
  personalize: '/settings',
  createSetlist: '/setlists',
  playHandsFree: '/songs',
  shareLink: '/setlists',
  joinFolder: '/folders',
  capoOrNumbers: '/songs',
} as const satisfies Record<GettingStartedStep, '/songs' | '/settings' | '/setlists' | '/folders'>;

export const useGettingStarted = (session: Session) => {
  const { data: setlists } = useQuery(setlistsQueryOptions());
  const stored = useStoredGettingStarted(session.id);
  return { progress: gettingStartedProgress(session, setlists ?? [], stored.done), stored };
};

// The done count in words for screen readers, and as a strip of pixels and `3/8` on screen.
export function GettingStartedMeter({ progress }: { progress: GettingStartedProgress }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden className="flex gap-[3px]">
        {progress.steps.map(({ step, done }) => (
          <i
            key={step}
            className={cn(
              'size-[7px]',
              done ? 'bg-pixel-on shadow-[0_0_6px_var(--pixel-glow)]' : 'bg-ink/26'
            )}
          />
        ))}
      </span>
      <span aria-hidden className="text-ink-2 font-mono text-[0.8125rem] font-semibold">
        {t('gettingStarted.progress', { done: progress.doneCount, total: progress.total })}
      </span>
      <span className="sr-only">
        {t('gettingStarted.progressLabel', { done: progress.doneCount, total: progress.total })}
      </span>
    </span>
  );
}

function StepMark({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-7 place-items-center rounded-full',
        done ? 'bg-fill-on text-ok' : 'border-hairline border-2'
      )}
    >
      {done ? <Check aria-hidden /> : null}
    </span>
  );
}

// Each step links to where it is done; a step is ticked by doing it, never by hand.
export function GettingStartedList({
  progress,
  className,
}: {
  progress: GettingStartedProgress;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <ol className={cn(LIST_CLASSES, className)}>
      {progress.steps.map(({ step, done }) => {
        const title = t(`gettingStarted.steps.${step}.title`);
        const description = t(`gettingStarted.steps.${step}.description`);
        return (
          <li key={step}>
            <Link
              to={STEP_LINKS[step]}
              aria-label={t('gettingStarted.stepLabel', {
                title,
                status: done ? t('gettingStarted.done') : t('gettingStarted.toDo'),
                description,
              })}
              className={listRowClasses('grid-cols-[28px_minmax(0,1fr)_auto]')}
            >
              <StepMark done={done} />
              <RowText title={title} meta={description} />
              <ChevronRight aria-hidden className="text-ink-3" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
