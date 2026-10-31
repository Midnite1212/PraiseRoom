import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { LETTER_FILTERS, type LetterFilter as Letter } from './song-groups';

// A row of first-letter chips under the search box; the picked one narrows the library to titles
// starting with it, and picking it again clears it. It scrolls sideways on phones.
export function LetterFilter({
  value,
  onChange,
}: {
  value: Letter | undefined;
  onChange: (letter: Letter | undefined) => void;
}) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('songs.filterByLetter')}
      className="no-scrollbar wide:flex-wrap -mx-1 mt-1 mb-1.5 flex gap-1 overflow-x-auto px-1 py-1"
    >
      {LETTER_FILTERS.map((letter) => {
        const isOn = letter === value;
        return (
          <button
            key={letter}
            type="button"
            aria-pressed={isOn}
            aria-label={t(letter === '#' ? 'songs.startingWithOther' : 'songs.startingWith', {
              letter,
            })}
            onClick={() => onChange(isOn ? undefined : letter)}
            className={cn(
              'relative h-7 min-w-7 shrink-0 rounded-full px-1.5 font-mono text-[0.75rem] font-bold after:absolute after:inset-x-0 after:-inset-y-1',
              isOn ? 'liquid-on' : 'text-ink-2 hover:liquid-hover focus-visible:liquid-hover'
            )}
          >
            {letter}
          </button>
        );
      })}
    </nav>
  );
}
