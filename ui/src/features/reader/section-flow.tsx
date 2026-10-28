import { useTranslation } from 'react-i18next';

import { parseChordLyrics } from '@/features/chords/parse';
import { uniqueSections } from '@/features/chords/unique-sections';

import { sectionElementId } from './lyrics-sheet';

// The song's order as a row of chips, one per section in the flow, when the sheet shows each section once.
// A repeated chip scrolls to the one block that shows it.
export function SectionFlow({ chordLyrics, idPrefix }: { chordLyrics: string; idPrefix: string }) {
  const { t } = useTranslation();
  const { sections, flow } = uniqueSections(parseChordLyrics(chordLyrics));
  if (flow.length < 2) return null;
  const visits = new Map<number, number>();
  const chips = flow.map((index) => {
    const visit = (visits.get(index) ?? 0) + 1;
    visits.set(index, visit);
    return { index, key: `${index}.${visit}` };
  });

  return (
    <nav aria-label={t('reader.flow.label')} className="mt-3 overflow-x-auto">
      <ol className="flex w-max gap-1.5">
        {chips.map(({ index, key }) => {
          const section = sections[index];
          if (!section) return null;
          const target = sectionElementId(idPrefix, section.id);
          return (
            <li key={key}>
              <button
                type="button"
                className="bg-fill-hover hover:bg-fill-press text-label h-8 rounded-md px-2.5 font-mono text-xs font-bold tracking-[0.12em] whitespace-nowrap uppercase transition-colors duration-150"
                onClick={() => document.getElementById(target)?.scrollIntoView({ block: 'start' })}
              >
                {section.label ?? t('reader.flow.unnamed', { n: index + 1 })}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
