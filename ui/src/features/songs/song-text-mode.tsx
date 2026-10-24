import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { MusicKey } from '@/features/chords/theory';

import { foldPastedChart } from './chart-fold';
import { type DraftSection, parseSections, placeChord, serializeSections } from './song-draft';
import { TapLine } from './song-sections';

type Picking = { section: string; line: number; start: number } | null;

type SongTextModeProps = {
  sections: DraftSection[];
  musicKey: MusicKey;
  focusOnMount?: boolean;
  onSectionsChange: (sections: DraftSection[], coalesceKey?: string) => void;
  onBlur: () => void;
};

// The whole song as one ChordPro textarea, with a live copy beside it on wide screens whose words take chords
// the same way Song mode's do. Both edit the same sections.
export function SongTextMode({
  sections,
  musicKey,
  focusOnMount = false,
  onSectionsChange,
  onBlur,
}: SongTextModeProps) {
  const { t } = useTranslation();
  const fieldId = useId();
  const [typed, setTyped] = useState<{ text: string; sections: DraftSection[] } | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const field = area.current;
    if (!focusOnMount || !field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, [focusOnMount]);
  const [picking, setPicking] = useState<Picking>(null);

  // What was just typed stays as typed (blank lines and all) until the draft changes some other way, such as an
  // undo or a chord from the preview; then the text is rebuilt from the sections.
  const text = typed?.sections === sections ? typed.text : serializeSections(sections);

  const change = (value: string, coalesceKey?: string) => {
    const next = parseSections(value);
    setTyped({ text: value, sections: next });
    onSectionsChange(next, coalesceKey);
  };

  const pickChord = (section: DraftSection, line: number, start: number, chord: string | null) => {
    setPicking(null);
    onSectionsChange(
      sections.map((candidate) =>
        candidate.id === section.id
          ? {
              ...candidate,
              lines: candidate.lines.map((raw, index) =>
                index === line ? placeChord(raw, start, chord) : raw
              ),
            }
          : candidate
      )
    );
  };

  return (
    <div className="roomy:grid-cols-2 roomy:gap-6 grid items-start gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId} className="text-ink-3 text-xs font-semibold">
          {t('songEditor.text.label')}
        </label>
        <textarea
          id={fieldId}
          ref={area}
          value={text}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={t('songEditor.text.placeholder')}
          aria-describedby={`${fieldId}-hint`}
          onChange={(event) => change(event.target.value, 'text')}
          onBlur={onBlur}
          onPaste={(event) => {
            if (foldPastedChart(event, (value) => change(value))) {
              toast(t('songEditor.text.chartFolded'));
            }
          }}
          className="border-hairline bg-fill-hover caret-chord placeholder:text-ink-3 focus-visible:border-chord/60 wide:min-h-[max(360px,calc(100vh-360px))] min-h-[56svh] resize-none rounded-2xl border px-4 py-3.5 font-mono text-sm leading-[1.6] font-medium transition-colors duration-150 outline-none"
        />
        <small id={`${fieldId}-hint`} className="text-ink-3 text-xs leading-[1.45]">
          {t('songEditor.text.hint')}
        </small>
      </div>
      <section
        aria-label={t('songEditor.text.previewLabel')}
        className="border-hairline font-lyrics text-lyrics wide:block roomy:sticky roomy:top-6 wide:mt-6 wide:min-h-[max(360px,calc(100vh-360px))] roomy:max-h-[calc(100vh-48px)] hidden overflow-y-auto rounded-2xl border px-6 py-5 leading-[1.45]"
      >
        {sections.length === 0 ? (
          <p className="text-ink-3 font-sans text-[0.8125rem]">
            {t('songEditor.text.previewEmpty')}
          </p>
        ) : (
          <>
            <p className="text-ink-3 mb-4 font-sans text-xs">{t('songEditor.text.previewHint')}</p>
            {sections.map((section) => (
              <div key={section.id} className="mb-[1.5em]">
                {section.label === '' ? null : (
                  <h3 className="text-ink-2 mb-[0.55em] flex items-center gap-2 font-sans text-xs leading-none font-bold tracking-[0.12em] uppercase">
                    <i aria-hidden className="bg-pixel-on size-1.5 flex-none" />
                    {section.label}
                  </h3>
                )}
                {section.lines
                  .map((raw, index) => ({ raw, index, id: `${section.id}.${index}` }))
                  .map(({ raw, index, id }) => (
                    <TapLine
                      key={id}
                      raw={raw}
                      musicKey={musicKey}
                      picking={
                        picking?.section === section.id && picking.line === index
                          ? picking.start
                          : null
                      }
                      onPickingChange={(start) =>
                        setPicking(
                          start === null ? null : { section: section.id, line: index, start }
                        )
                      }
                      onChord={(start, chord) => pickChord(section, index, start, chord)}
                    />
                  ))}
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
