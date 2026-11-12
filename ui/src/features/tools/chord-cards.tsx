import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { findChordShapes, guitarChordsQueryOptions } from '@/features/chords/chord-shapes';
import { ChordShapeCard } from '@/features/reader/chord-chart';

export type ChordCard = { name: string; caption?: string; nameClassName?: string };

export function ChordCards({ chords, label }: { chords: readonly ChordCard[]; label: string }) {
  const { t } = useTranslation();
  const { data: db, isError } = useQuery(guitarChordsQueryOptions);

  return (
    <>
      {isError ? (
        <p className="text-ink-3 mb-2 text-sm">{t('reader.chordChart.loadFailed')}</p>
      ) : null}
      <ul
        aria-label={label}
        className="wide:flex wide:flex-wrap wide:gap-2 relative grid grid-cols-4 gap-1.5"
      >
        {chords.map(({ name, caption, nameClassName }) => (
          <ChordShapeCard
            key={name}
            name={name}
            caption={caption}
            nameClassName={nameClassName}
            shapes={db ? findChordShapes(db, name) : isError ? [] : null}
            className="wide:w-[92px] wide:px-1.5 roomy:w-[92px] w-auto min-w-0 px-1"
          />
        ))}
      </ul>
    </>
  );
}
