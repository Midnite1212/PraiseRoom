import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { ChordedHeading } from './chorded-heading';

export const EYEBROW_CLASSES =
  'text-brand m-0 font-mono text-xs font-semibold tracking-[0.14em] uppercase';

export function SectionHead({
  id,
  eyebrow,
  title,
  chords,
  musicKey = 'G',
  lede,
  className,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  chords: readonly string[];
  musicKey?: string;
  lede?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-10 grid max-w-[46rem] content-start gap-3', className)}>
      {eyebrow ? <p className={EYEBROW_CLASSES}>{eyebrow}</p> : null}
      <ChordedHeading
        id={id}
        text={title}
        chords={chords}
        musicKey={musicKey}
        className="text-headline m-0 font-bold tracking-[-0.03em]"
      />
      {lede ? <p className="text-ink-2 m-0 text-[1.0625rem] leading-relaxed">{lede}</p> : null}
    </header>
  );
}
