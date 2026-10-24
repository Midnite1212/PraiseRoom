import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'pixelarticons/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EditorFrame } from '@/components/editor/editor-frame';
import { EmptyState } from '@/components/page/empty-state';
import { GroupTitle } from '@/components/page/group-title';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Session } from '@/features/auth/session';
import { goneToast } from '@/features/folders/gone-toast';
import type { SongSummary } from '@/features/songs/api';
import { useAutosave } from '@/hooks/use-autosave';
import { useUndoHistory } from '@/hooks/use-undo-history';
import { useIsWide } from '@/hooks/use-wide';

import { updateSetlist } from '../api';
import { toDateInputValue } from '../format-date';
import { FlowBar } from './flow-bar';
import { DateChip, FoldersChip } from './setlist-chips';
import {
  addSong,
  type DraftSong,
  draftToInput,
  hasName,
  isSameDraft,
  removeSong,
  reorderSongs,
  type SetlistDraft,
  stepSongKey,
  toggleFolder,
} from './setlist-draft';
import { SongPicker } from './song-picker';
import { SongRows } from './song-rows';

type SetlistEditorProps = {
  session: Session;
  setlistId: string;
  initialDraft: SetlistDraft;
  // The time the page loaded, for "today" in the date chip and the folder covers.
  now: number;
};

const NAME_MAX_LENGTH = 60;

// The setlist editor on the autosave frame: every change saves as you go, and Done returns to the list with this
// setlist selected. The server still decides who may edit and which folders may be linked.
export function SetlistEditor({ session, setlistId, initialDraft, now }: SetlistEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isWide = useIsWide();
  const titleRef = useRef<HTMLInputElement>(null);
  const history = useUndoHistory(initialDraft);
  const draft = history.value;

  const save = useMutation({
    mutationFn: (value: SetlistDraft) => updateSetlist(setlistId, draftToInput(value)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['setlists'], refetchType: 'none' }),
  });
  const autosave = useAutosave({
    value: draft,
    save: save.mutateAsync,
    enabled: hasName(draft),
    isEqual: isSameDraft,
  });

  const change = (next: SetlistDraft) => history.set(next);
  const songIds = new Set(draft.songs.map(({ _id }) => _id));

  const remove = (song: DraftSong) => {
    change(removeSong(draft, song._id));
    goneToast(t('editor.removed', { title: song.title }));
  };
  const toggleSong = (song: SongSummary) =>
    songIds.has(song._id) ? change(removeSong(draft, song._id)) : change(addSong(draft, song));

  const done = async () => {
    if (!hasName(draft)) {
      toast.error(t('editor.nameRequired'));
      titleRef.current?.focus();
      return;
    }
    if (!(await autosave.flush())) {
      toast.error(t('editor.saveFailed'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['setlists'], refetchType: 'all' });
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
    await navigate({ to: '/setlists', search: { set: setlistId } });
  };

  const picker = <SongPicker selectedIds={songIds} onToggle={toggleSong} />;

  return (
    <EditorFrame
      names={
        <>
          <input
            ref={titleRef}
            value={draft.name}
            maxLength={NAME_MAX_LENGTH}
            placeholder={t('editor.namePlaceholder')}
            aria-label={t('editor.name')}
            className="placeholder:text-ink-3 caret-chord w-full border-0 bg-transparent p-0 text-[1.75rem] leading-[1.08] font-bold tracking-[-0.03em] outline-none"
            onChange={(event) =>
              history.set({ ...draft, name: event.target.value }, { coalesceKey: 'name' })
            }
            onBlur={history.endCoalesce}
          />
          <FlowBar songs={draft.songs} />
        </>
      }
      status={autosave.status}
      onRetry={autosave.retry}
      canUndo={history.canUndo}
      onUndo={history.undo}
      onDone={done}
      barActions={
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="secondary" size="lg">
              <Plus />
              {t('editor.addSongs')}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-4 data-[side=bottom]:h-[85svh]">
            <SheetHeader className="p-0">
              <SheetTitle>{t('editor.addSongs')}</SheetTitle>
            </SheetHeader>
            {picker}
          </SheetContent>
        </Sheet>
      }
      chips={
        <>
          <DateChip
            value={draft.date}
            today={toDateInputValue(new Date(now).toISOString())}
            onChange={(date) => change({ ...draft, date })}
          />
          <FoldersChip
            session={session}
            value={draft.groupIds}
            now={now}
            onToggle={(folderId) => change(toggleFolder(draft, folderId))}
          />
        </>
      }
    >
      <div className="wide:grid-cols-[minmax(0,1fr)_380px] wide:items-start grid gap-x-10 gap-y-2">
        <section aria-labelledby="editor-songs" className="min-w-0">
          <GroupTitle
            first
            id="editor-songs"
            title={t('editor.songs')}
            count={draft.songs.length}
            hint={<span className="wide:inline hidden">{t('editor.songsHint')}</span>}
          />
          {draft.songs.length === 0 ? (
            <EmptyState title={t('editor.noSongs')}>
              {t(isWide ? 'editor.noSongsWide' : 'editor.noSongsPhone')}
            </EmptyState>
          ) : (
            <SongRows
              songs={draft.songs}
              onReorder={(songs) => change(reorderSongs(draft, songs))}
              onStepKey={(songId, step) => change(stepSongKey(draft, songId, step))}
              onRemove={remove}
            />
          )}
        </section>
        {isWide ? (
          <aside
            aria-label={t('editor.addSongs')}
            className="border-hairline sticky top-3.5 flex max-h-[calc(100vh-28px)] flex-col gap-2 border-l pl-8"
          >
            <GroupTitle first title={t('editor.addSongs')} className="mb-0" />
            <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col">{picker}</div>
          </aside>
        ) : null}
      </div>
    </EditorFrame>
  );
}
