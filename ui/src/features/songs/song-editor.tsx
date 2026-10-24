import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EditorFrame } from '@/components/editor/editor-frame';
import { ReorderList } from '@/components/editor/reorder-list';
import { PAGE_TITLE_CLASSES } from '@/components/page/page-header';
import { keyLabel, type MusicKey } from '@/features/chords/theory';
import { useLyricsSize } from '@/features/reader/lyrics-size';
import { useAutosave } from '@/hooks/use-autosave';
import { useUndoHistory } from '@/hooks/use-undo-history';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

import { type Song, type SongInput, songQueryOptions, updateSong } from './api';
import {
  type DraftSection,
  draftProblem,
  nextSectionLabel,
  placeChord,
  type SectionType,
  type SongDraft,
  sameInput,
  toDraft,
  toSongInput,
  withAutoKey,
} from './song-draft';
import {
  CodeSettingChip,
  KeySettingChip,
  TempoSettingChip,
  ThemesSettingChip,
  TimeSettingChip,
} from './song-editor-chips';
import { AddSections, SectionBlock } from './song-sections';

const titleField =
  'w-full min-w-0 bg-transparent p-0 outline-none caret-chord placeholder:text-ink-3';

// Edits one song for editors and admins; the server's SONG_WRITERS rule is the real gate. Every change
// saves as it goes through the song update endpoint, which replaces the song.
export function SongEditor({ song }: { song: Song }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const wide = useIsWide();
  const [lyricsSize] = useLyricsSize();
  const history = useUndoHistory(toDraft(song));
  const draft = history.value;
  const [editingId, setEditingId] = useState<string | null>(() => {
    const [only] = draft.sections;
    return draft.sections.length === 1 && only?.lines.length === 0 ? only.id : null;
  });

  const save = useMutation({
    mutationFn: (input: SongInput) => updateSong(song._id, input),
    onSuccess: async (_saved, input) => {
      queryClient.setQueryData(songQueryOptions(song._id).queryKey, (current) =>
        current ? { ...current, ...input } : current
      );
      await queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
    },
  });
  const problem = draftProblem(draft);
  const autosave = useAutosave({
    value: draft,
    save: (value) => save.mutateAsync(toSongInput(value)),
    enabled: problem === null,
    isEqual: sameInput,
  });

  const update = (next: SongDraft, coalesceKey?: string) =>
    history.set(withAutoKey(next), coalesceKey === undefined ? undefined : { coalesceKey });

  const updateSection = (
    id: string,
    change: (section: DraftSection) => DraftSection,
    key?: string
  ) =>
    update({ ...draft, sections: draft.sections.map((s) => (s.id === id ? change(s) : s)) }, key);

  const addSection = (type: SectionType) => {
    const id = crypto.randomUUID();
    update({
      ...draft,
      sections: [
        ...draft.sections,
        { id, label: nextSectionLabel(draft.sections, type), lines: [] },
      ],
    });
    setEditingId(id);
  };

  const removeSection = (section: DraftSection) => {
    update({ ...draft, sections: draft.sections.filter((s) => s.id !== section.id) });
    if (editingId === section.id) setEditingId(null);
    toast(t('songEditor.removed', { name: section.label || t('songEditor.unnamedSection') }), {
      action: { label: t('editor.frame.undo'), onClick: history.undo },
    });
  };

  const setKey = (key: MusicKey) => update({ ...draft, key, keyAuto: false });

  const done = async () => {
    if (problem !== null) {
      toast.error(t(problem === 'title' ? 'songEditor.needsTitle' : 'songEditor.needsLyrics'));
      return;
    }
    if (await autosave.flush()) {
      await navigate({ to: '/songs/$songId', params: { songId: song._id } });
    }
  };

  const hint = (
    <p className="text-ink-3 mb-4 text-[0.8125rem]">
      {draft.sections.length === 0
        ? t('songEditor.hintEmpty')
        : t(wide ? 'songEditor.hintClick' : 'songEditor.hintTap', { key: keyLabel(draft.key) })}
    </p>
  );

  return (
    <EditorFrame
      names={
        <div className="grid gap-0.5">
          <input
            value={draft.title}
            maxLength={80}
            placeholder={t('songEditor.titlePlaceholder')}
            aria-label={t('songEditor.titleLabel')}
            onChange={(event) => update({ ...draft, title: event.target.value }, 'title')}
            onBlur={history.endCoalesce}
            className={cn(PAGE_TITLE_CLASSES, titleField, 'text-balance')}
          />
          <input
            value={draft.artist}
            maxLength={80}
            placeholder={t('songEditor.artistPlaceholder')}
            aria-label={t('songEditor.artistLabel')}
            onChange={(event) => update({ ...draft, artist: event.target.value }, 'artist')}
            onBlur={history.endCoalesce}
            className={cn(titleField, 'text-ink-2 py-1 text-base')}
          />
        </div>
      }
      status={autosave.status}
      onRetry={autosave.retry}
      canUndo={history.canUndo}
      onUndo={history.undo}
      onDone={done}
      chips={
        <>
          <KeySettingChip value={draft.key} auto={draft.keyAuto} onChange={setKey} />
          <TempoSettingChip value={draft.tempo} onChange={(tempo) => update({ ...draft, tempo })} />
          <TimeSettingChip
            value={draft.timeSignature}
            onChange={(timeSignature) => update({ ...draft, timeSignature })}
          />
          <ThemesSettingChip
            value={draft.themes}
            onChange={(themes) => update({ ...draft, themes })}
          />
          <CodeSettingChip
            value={draft.code}
            onChange={(code) => update({ ...draft, code }, 'code')}
            onBlur={history.endCoalesce}
          />
        </>
      }
    >
      <div data-lyrics-size={lyricsSize} className="max-w-[760px]">
        {hint}
        <ReorderList
          items={draft.sections}
          getKey={(section) => section.id}
          getLabel={(section) => section.label || t('songEditor.unnamedSection')}
          onReorder={(sections) => update({ ...draft, sections })}
          className="gap-4"
          renderItem={(section, _index, handle) => (
            <SectionBlock
              section={section}
              handle={handle}
              editing={editingId === section.id}
              musicKey={draft.key}
              onToggleEdit={() => setEditingId(editingId === section.id ? null : section.id)}
              onLabelChange={(label) =>
                updateSection(section.id, (s) => ({ ...s, label }), `label:${section.id}`)
              }
              onLinesChange={(lines) =>
                updateSection(section.id, (s) => ({ ...s, lines }), `lines:${section.id}`)
              }
              onChordChange={(line, wordStart, chord) =>
                updateSection(section.id, (s) => ({
                  ...s,
                  lines: s.lines.map((raw, index) =>
                    index === line ? placeChord(raw, wordStart, chord) : raw
                  ),
                }))
              }
              onRemove={() => removeSection(section)}
              onFieldBlur={history.endCoalesce}
            />
          )}
        />
        <AddSections onAdd={addSection} />
      </div>
    </EditorFrame>
  );
}
