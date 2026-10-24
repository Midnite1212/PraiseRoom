import { type PointerEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import type { SongGroup } from './song-groups';

const OTHER = '#';

const idAt = (strip: HTMLElement, clientY: number) =>
  document
    .elementFromPoint(strip.getBoundingClientRect().left + 8, clientY)
    ?.closest<HTMLElement>('[data-group]')?.dataset.group;

// A strip on the right edge of phones: tap or drag a letter to jump to that group of the loaded list.
export function LetterScrubber({ groups }: { groups: readonly SongGroup[] }) {
  const { t } = useTranslation();
  const [currentId, setCurrentId] = useState<string | null>(null);

  const jump = (id: string | undefined) => {
    if (!id) return;
    setCurrentId(id);
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    jump(idAt(event.currentTarget, event.clientY));
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      jump(idAt(event.currentTarget, event.clientY));
  };

  return (
    <nav
      aria-label={t('songs.jumpToLetter')}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      className="wide:hidden fixed top-1/2 right-[max(2px,env(safe-area-inset-right))] z-20 grid -translate-y-1/2 touch-none py-1.5"
    >
      {groups.map((group) => (
        <button
          key={group.id}
          type="button"
          data-group={group.id}
          aria-current={group.id === currentId}
          aria-label={t(group.label === OTHER ? 'songs.startingWithOther' : 'songs.startingWith', {
            letter: group.label,
          })}
          onClick={(event) => {
            if (event.detail === 0) jump(group.id);
          }}
          className={cn(
            'relative h-5 w-4 font-mono text-[0.6875rem] font-bold after:absolute after:inset-y-0 after:-inset-x-3.5',
            group.id === currentId ? 'text-chord' : 'text-ink-3'
          )}
        >
          {group.label}
        </button>
      ))}
    </nav>
  );
}
