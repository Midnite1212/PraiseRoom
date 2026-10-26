import { PenSquare, Plus, Trash } from 'pixelarticons/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { RemoveIcon } from '@/components/primitives/pixel-icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type MusicKey, parseChord } from '@/features/chords/theory';
import { cn } from '@/lib/utils';

import { foldPastedChart } from './chart-fold';
import {
  chordsOnWord,
  type DraftSection,
  diatonicChords,
  END_SLOT,
  LEAD_SLOT,
  parseLine,
  SECTION_TYPES,
  type SectionType,
  slotsOf,
} from './song-draft';

type Picking = { line: number; start: number } | null;

type SectionBlockProps = {
  section: DraftSection;
  handle: ReactNode;
  editing: boolean;
  musicKey: MusicKey;
  onToggleEdit: () => void;
  onLabelChange: (label: string) => void;
  onLinesChange: (lines: string[]) => void;
  onChordChange: (line: number, wordStart: number, chord: string | null) => void;
  onRemove: () => void;
  onFieldBlur: () => void;
};

// One section of the song: its name, and its lines as words you tap to put a chord over. "Edit lyrics" swaps the
// lines for a textarea where chords can also be typed in brackets.
export function SectionBlock({
  section,
  handle,
  editing,
  musicKey,
  onToggleEdit,
  onLabelChange,
  onLinesChange,
  onChordChange,
  onRemove,
  onFieldBlur,
}: SectionBlockProps) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState<Picking>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editing) textarea.current?.focus();
  }, [editing]);
  const name = section.label || t('songEditor.unnamedSection');
  const hasLyrics = section.lines.some((line) => line.trim() !== '');
  const pickChord = (line: number, start: number, chord: string | null) => {
    setPicking(null);
    onChordChange(line, start, chord);
  };

  return (
    <section
      aria-label={name}
      data-editing={editing ? '' : undefined}
      className="border-hairline data-editing:border-chord/50 rounded-[20px] border py-2 pr-4 pb-4 pl-1 transition-colors duration-150"
    >
      <div className="mb-1 flex items-center gap-1">
        {handle}
        <i aria-hidden className="bg-pixel-on mr-1.5 size-1.5 flex-none" />
        <input
          value={section.label}
          maxLength={30}
          aria-label={t('songEditor.sectionName')}
          onChange={(event) => onLabelChange(event.target.value)}
          onBlur={onFieldBlur}
          className="text-ink-2 focus-visible:text-ink h-8 min-w-0 flex-1 bg-transparent p-0 text-xs font-bold tracking-[0.12em] uppercase outline-none focus-visible:shadow-[0_2px_0_var(--chord)]"
        />
        <Button type="button" variant="ghost" size="sm" onClick={onToggleEdit}>
          {editing ? t('songEditor.doneLyrics') : t('songEditor.editLyrics')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('songEditor.removeSection', { name })}
          title={t('songEditor.removeSectionTitle')}
          onClick={onRemove}
        >
          <RemoveIcon />
        </Button>
      </div>

      {editing ? (
        <textarea
          value={section.lines.join('\n')}
          rows={Math.max(4, section.lines.length + 1)}
          ref={textarea}
          spellCheck={false}
          aria-label={t('songEditor.lyricsFor', { name })}
          placeholder={t('songEditor.lyricsPlaceholder')}
          onChange={(event) => onLinesChange(event.target.value.split('\n'))}
          onPaste={(event) => {
            if (foldPastedChart(event, (value) => onLinesChange(value.split('\n')))) {
              toast(t('songEditor.text.chartFolded'));
            }
          }}
          onBlur={onFieldBlur}
          className="border-hairline wide:ml-10 wide:w-[calc(100%-2.5rem)] focus-visible:border-chord/50 ml-3 block w-[calc(100%-0.75rem)] resize-y rounded-2xl border bg-transparent px-3.5 py-3 font-mono text-[0.9375rem] leading-[1.6] outline-none"
        />
      ) : hasLyrics ? (
        <div className="font-lyrics text-lyrics wide:ml-10 ml-3 leading-[1.45]">
          {section.lines
            .map((raw, index) => ({ raw, index, id: `${section.id}.${index}` }))
            .map(({ raw, index, id }) => (
              <TapLine
                key={id}
                raw={raw}
                musicKey={musicKey}
                picking={picking?.line === index ? picking.start : null}
                onPickingChange={(start) =>
                  setPicking(start === null ? null : { line: index, start })
                }
                onChord={(start, chord) => pickChord(index, start, chord)}
              />
            ))}
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="wide:ml-10 ml-3 h-10 pr-3.5 pl-3"
          onClick={onToggleEdit}
        >
          <PenSquare />
          {t('songEditor.typeLyrics')}
        </Button>
      )}
    </section>
  );
}

type TapLineProps = {
  raw: string;
  musicKey: MusicKey;
  picking: number | null;
  onPickingChange: (start: number | null) => void;
  onChord: (wordStart: number, chord: string | null) => void;
};

export function TapLine({ raw, musicKey, picking, onPickingChange, onChord }: TapLineProps) {
  const line = parseLine(raw);
  if (line.text.trim() === '') {
    if (line.chords.length === 0) return <p aria-hidden className="m-0 h-[0.6em]" />;
    return (
      <p className="m-0 flex flex-wrap gap-x-[0.28em] pl-5 [&+p]:mt-[0.35em]">
        <span className="text-chord min-h-[1.3em] font-mono leading-[1.3] font-semibold whitespace-nowrap">
          {line.chords.map(({ name }) => name).join(' ')}
        </span>
      </p>
    );
  }
  const slots = slotsOf(line.text).map((slot) => (
    <WordButton
      key={slot.start}
      word={slot.text}
      slot={slot.start === LEAD_SLOT ? 'lead' : slot.start === END_SLOT ? 'end' : null}
      chords={chordsOnWord(line, slot)}
      musicKey={musicKey}
      open={picking === slot.start}
      onOpenChange={(open) => onPickingChange(open ? slot.start : null)}
      onChord={(chord) => onChord(slot.start, chord)}
    />
  ));
  const tail = slots.splice(-2);
  return (
    <p className="relative m-0 flex flex-wrap gap-x-[0.28em] pl-5 [&+p]:mt-[0.35em]">
      {slots}
      <span className="inline-flex gap-x-[0.28em]">{tail}</span>
    </p>
  );
}

type WordButtonProps = {
  word: string;
  slot: 'lead' | 'end' | null;
  chords: string[];
  musicKey: MusicKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChord: (chord: string | null) => void;
};

function WordButton({
  word,
  slot,
  chords,
  musicKey,
  open,
  onOpenChange,
  onChord,
}: WordButtonProps) {
  const { t } = useTranslation();
  const on = chords.join(' ');
  const where = slot === null ? null : t(`songEditor.slot.${slot}`);
  const label = where
    ? t(on ? 'songEditor.chordAt' : 'songEditor.addChordAt', { chord: on, where })
    : on
      ? t('songEditor.chordOn', { chord: on, word })
      : t('songEditor.addChordTo', { word });
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            'group/word hover:bg-fill-hover aria-expanded:bg-fill-on -mx-[3px] inline-flex flex-col items-start rounded-lg px-[3px] py-0.5 text-left transition-colors duration-100',
            slot !== null && 'min-w-[18px]',
            slot === 'lead' && !on && 'absolute top-0 right-[calc(100%-18px)] m-0 items-end'
          )}
        >
          <span
            className={cn(
              'text-chord min-h-[1.3em] font-mono leading-[1.3] font-semibold whitespace-nowrap',
              slot === null
                ? "group-hover/word:empty:after:text-ink-3 group-aria-expanded/word:empty:after:text-ink-3 group-hover/word:empty:after:content-['+'] group-aria-expanded/word:empty:after:content-['+']"
                : "empty:after:text-ink-3 empty:after:content-['+'] empty:after:opacity-50"
            )}
          >
            {on}
          </span>
          <span className={cn('whitespace-pre', slot !== null && 'min-h-[1.3em]')}>{word}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="w-[300px] max-w-[calc(100vw-24px)] gap-0"
      >
        <ChordPicker
          word={word}
          slot={slot}
          current={chords}
          musicKey={musicKey}
          onChord={onChord}
        />
      </PopoverContent>
    </Popover>
  );
}

type ChordPickerProps = {
  word: string;
  slot: 'lead' | 'end' | null;
  current: string[];
  musicKey: MusicKey;
  onChord: (chord: string | null) => void;
};

// The key's six chords, then any other chord by name.
function ChordPicker({ word, slot, current, musicKey, onChord }: ChordPickerProps) {
  const { t } = useTranslation();
  const palette = diatonicChords(musicKey);
  const only = current.length === 1 ? current[0] : undefined;
  const [custom, setCustom] = useState(
    only !== undefined && !palette.some(({ chord }) => chord === only) ? only : ''
  );
  const typed = custom.trim();
  const valid = typed !== '' && parseChord(typed) !== null;
  return (
    <div className="flex flex-col">
      <p className="text-ink-2 mx-1 mb-3 text-sm">
        {slot === null ? (
          <Trans
            i18nKey="songEditor.chordOver"
            values={{ word }}
            components={{ word: <b className="text-ink" /> }}
          />
        ) : (
          <Trans
            i18nKey={`songEditor.chordSlot.${slot}`}
            components={{ where: <b className="text-ink" /> }}
          />
        )}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {palette.map(({ chord, numeral }) => (
          <button
            key={chord}
            type="button"
            aria-pressed={chord === only}
            onClick={() => onChord(chord)}
            className="bg-fill-hover hover:bg-fill-press aria-pressed:bg-chord aria-pressed:text-ground group/chord grid justify-items-center gap-0.5 rounded-[14px] pt-2.5 pb-2 transition-colors duration-150"
          >
            <b className="font-mono text-base font-bold">{chord}</b>
            <small className="text-ink-3 group-aria-pressed/chord:text-ground/70 font-mono text-[0.6875rem] font-semibold">
              {numeral}
            </small>
          </button>
        ))}
      </div>
      <form
        className="mt-2.5 mb-1 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onChord(typed);
        }}
      >
        <input
          value={custom}
          maxLength={10}
          placeholder={t('songEditor.anotherChord')}
          aria-label={t('songEditor.anotherChordLabel')}
          aria-invalid={typed !== '' && !valid}
          onChange={(event) => setCustom(event.target.value)}
          className="bg-fill-hover placeholder:text-ink-3 focus-visible:ring-chord/50 aria-invalid:ring-destructive/40 h-10 min-w-0 flex-1 rounded-xl px-3 font-mono text-sm outline-none placeholder:font-sans focus-visible:ring-2 aria-invalid:ring-2"
        />
        <Button type="submit" variant="secondary" className="h-10 px-4" disabled={!valid}>
          {t('songEditor.setChord')}
        </Button>
      </form>
      {current.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          className="text-destructive mt-1 justify-start gap-2.5 rounded-xl"
          onClick={() => onChord(null)}
        >
          <Trash />
          {t('songEditor.removeChord', { chord: current.join(' ') })}
        </Button>
      ) : null}
    </div>
  );
}

type AddSectionsProps = { onAdd: (type: SectionType) => void };

export function AddSections({ onAdd }: AddSectionsProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-ink-3 mr-1 text-[0.8125rem]">{t('songEditor.addSection')}</span>
      {SECTION_TYPES.map((type) => (
        <Button
          key={type}
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 pr-3.5 pl-2.5 text-sm"
          onClick={() => onAdd(type)}
        >
          <Plus />
          {t(`songEditor.sectionTypes.${type}`)}
        </Button>
      ))}
    </div>
  );
}
