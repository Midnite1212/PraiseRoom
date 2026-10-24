import { FileText, Plus } from 'pixelarticons/react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { SONG_NOTE_MAX_LENGTH } from '../api';

type SongNoteProps = {
  title: string;
  note: string;
  onChange: (note: string) => void;
  // Called when editing ends, so typing in one field counts as one undo step.
  onCommit: () => void;
};

const PILL_CLASSES =
  'mt-1.5 inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-[10px] py-[3px] pr-2.5 text-left text-[0.8125rem] font-semibold transition-colors [&_svg]:size-3.5 [&_svg]:flex-none';

// The note on one song in this set: a quiet "+ Note" button, or a pill with the text once there is one. Pressing
// it swaps in an input; Enter, Escape, or leaving the field keeps what was typed.
export function SongNote({ title, note, onChange, onCommit }: SongNoteProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (isEditing || !restoreFocus.current) return;
    restoreFocus.current = false;
    buttonRef.current?.focus();
  });

  const finish = () => {
    setIsEditing(false);
    onCommit();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    restoreFocus.current = true;
    finish();
  };

  if (isEditing) {
    return (
      <input
        ref={(element) => element?.focus()}
        value={note}
        maxLength={SONG_NOTE_MAX_LENGTH}
        placeholder={t('editor.notePlaceholder')}
        aria-label={t('editor.noteFor', { title })}
        className="border-chord/50 bg-fill-hover text-ink mt-1.5 block h-[34px] w-full rounded-[10px] border px-2.5 text-[0.8125rem] outline-none"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={finish}
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={
        note === '' ? t('editor.addNoteFor', { title }) : t('editor.editNoteFor', { title })
      }
      className={cn(
        PILL_CLASSES,
        note === ''
          ? 'text-ink-3 hover:text-ink hover:bg-fill-press min-h-7 pl-1.5'
          : 'bg-fill-hover text-ink-2 hover:bg-fill-press hover:text-ink pl-2'
      )}
      onClick={() => setIsEditing(true)}
    >
      {note === '' ? (
        <>
          <Plus />
          {t('editor.note')}
        </>
      ) : (
        <>
          <FileText className="text-chord" />
          <span className="min-w-0 break-words">{note}</span>
        </>
      )}
    </button>
  );
}
