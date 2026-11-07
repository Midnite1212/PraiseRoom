import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type ChordShape,
  findChordShapes,
  guitarChordsQueryOptions,
} from '@/features/chords/chord-shapes';
import { cn } from '@/lib/utils';

import { ChordDiagram } from './chord-diagram';

const DIAGRAM_BOX = 'aspect-[86/94] w-[76px]';

// One chord: its name, a diagram, and prev/next through the dataset's other voicings.
export function ChordShapeCard({ name, shapes }: { name: string; shapes: ChordShape[] | null }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const count = shapes?.length ?? 0;
  const shape = shapes?.[index % Math.max(count, 1)];
  const step = (by: number) => setIndex((current) => (current + by + count) % count);

  return (
    <li className="bg-fill-hover roomy:w-auto flex w-[92px] flex-none snap-start flex-col items-center gap-1 rounded-2xl px-1.5 pt-2 pb-1.5">
      <span className="text-chord max-w-full truncate font-mono text-sm font-bold">{name}</span>
      {shapes === null ? (
        <Skeleton className={cn(DIAGRAM_BOX, 'rounded-xl')} />
      ) : shape ? (
        <ChordDiagram name={name} shape={shape} className={DIAGRAM_BOX} />
      ) : (
        <span
          className={cn(
            DIAGRAM_BOX,
            'border-hairline text-ink-3 grid place-items-center rounded-xl border border-dashed px-1 text-center text-[0.6875rem] leading-tight'
          )}
        >
          {t('reader.chordChart.noDiagram')}
        </span>
      )}
      <div className="flex h-7 items-center gap-0.5">
        {count > 1 ? (
          <>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('reader.chordChart.previous', { name })}
              onClick={() => step(-1)}
            >
              <ChevronLeft />
            </Button>
            <span className="text-ink-3 min-w-7 text-center font-mono text-[0.6875rem] font-semibold">
              <span aria-hidden>
                {(index % count) + 1}/{count}
              </span>
              <span className="sr-only">
                {t('reader.chordChart.position', { current: (index % count) + 1, total: count })}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('reader.chordChart.next', { name })}
              onClick={() => step(1)}
            >
              <ChevronRight />
            </Button>
          </>
        ) : null}
      </div>
    </li>
  );
}

// The chords a song uses as guitar shapes: a sticky column beside the lyrics on roomy screens, a
// strip that scrolls sideways under the song's header everywhere else.
export function ChordChart({ chords, className }: { chords: string[]; className?: string }) {
  const { t } = useTranslation();
  const headingId = useId();
  const { data: db, isError } = useQuery(guitarChordsQueryOptions);

  return (
    <aside
      aria-labelledby={headingId}
      className={cn(
        'roomy:sticky roomy:top-[calc(var(--top)+var(--top-h)+var(--bar-h)+16px)] roomy:mb-0 roomy:max-h-[calc(100svh-var(--top)-var(--top-h)-var(--bar-h)-32px)] roomy:self-start roomy:overflow-y-auto mb-6 min-w-0',
        className
      )}
    >
      <h2
        id={headingId}
        className="text-ink-3 mb-2 font-mono text-xs leading-none font-bold tracking-[0.12em] uppercase"
      >
        {t('reader.chordChart.title')}
      </h2>
      {isError ? (
        <p className="text-ink-3 mb-2 text-sm">{t('reader.chordChart.loadFailed')}</p>
      ) : null}
      <ul className="roomy:mx-0 roomy:grid roomy:grid-cols-2 roomy:overflow-visible roomy:px-0 roomy:pb-0 -mx-[18px] flex snap-x gap-2 overflow-x-auto px-[18px] pb-1">
        {chords.map((name) => (
          <ChordShapeCard
            key={name}
            name={name}
            shapes={db ? findChordShapes(db, name) : isError ? [] : null}
          />
        ))}
      </ul>
    </aside>
  );
}
