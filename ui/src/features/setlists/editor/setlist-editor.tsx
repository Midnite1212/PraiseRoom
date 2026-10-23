import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBlocker, useNavigate, useRouter } from '@tanstack/react-router';
import { SectionPlus, Trash } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { PAGE_TITLE_CLASSES } from '@/components/page/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Session } from '@/features/auth/session';
import type { SongSummary } from '@/features/songs/api';

import { createSetlist, type SetlistInput, setlistQueryOptions, updateSetlist } from '../api';
import { fromDateInputValue } from '../format-date';
import { useDeleteSetlist } from '../use-delete-setlist';
import { type EditorSong, toSongKeys } from './editor-song';
import { EditorSongList } from './editor-song-list';
import { FolderPicker } from './folder-picker';
import { SongPicker } from './song-picker';

export type SetlistEditorValues = {
  name: string;
  date: string;
  songs: EditorSong[];
  groupIds: string[];
};

type SetlistEditorProps = {
  session: Session;
  initialValues: SetlistEditorValues;
  setlistId?: string;
  canDelete?: boolean;
};

const toEditorSong = (song: SongSummary): EditorSong => ({
  _id: song._id,
  title: song.title,
  artist: song.artist,
  originalKey: song.originalKey,
  key: song.originalKey,
});

export function SetlistEditor({
  session,
  initialValues,
  setlistId,
  canDelete = false,
}: SetlistEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const isEditing = setlistId !== undefined;

  const save = useMutation({
    mutationFn: (input: SetlistInput) =>
      setlistId ? updateSetlist(setlistId, input) : createSetlist(input),
  });
  const remove = useDeleteSetlist();

  const schema = z.object({
    name: z.string().trim().min(1, t('editor.nameRequired')).max(100, t('editor.nameTooLong')),
    date: z.string(),
    songs: z.array(z.custom<EditorSong>()),
    groupIds: z.array(z.string()),
  });

  const form = useForm({
    defaultValues: initialValues,
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const saved = await save.mutateAsync({
          name: value.name.trim(),
          date: fromDateInputValue(value.date),
          songs: value.songs.map(({ _id }) => _id),
          songKeys: toSongKeys(value.songs),
          groupIds: value.groupIds,
        });
        formApi.reset(value);
        // Mark everything stale but only wait for the setlist being opened, so the detail page
        // renders the saved version immediately instead of the editor lingering while it loads.
        await queryClient.invalidateQueries({ queryKey: ['setlists'], refetchType: 'none' });
        await queryClient.fetchQuery({ ...setlistQueryOptions(saved._id), staleTime: 0 });
        toast.success(t(isEditing ? 'editor.saved' : 'editor.created'));
        await navigate({ to: '/setlists/$setlistId', params: { setlistId: saved._id } });
      } catch {
        toast.error(t('editor.saveFailed'));
      }
    },
  });

  useBlocker({
    shouldBlockFn: () =>
      form.state.isDirty && !form.state.isSubmitting && !window.confirm(t('editor.leaveConfirm')),
  });

  const handleDelete = async () => {
    if (!setlistId) return;
    try {
      await remove.mutateAsync(setlistId);
    } catch {
      return;
    }
    form.reset();
    await navigate({ to: '/setlists' });
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <h1 data-page-title className={PAGE_TITLE_CLASSES}>
          {t(isEditing ? 'editor.editTitle' : 'editor.newTitle')}
        </h1>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => router.history.back()}>
            {t('editor.cancel')}
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {t(isEditing ? 'editor.save' : 'editor.create')}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>

      <div className="wide:grid-cols-[minmax(0,1fr)_22rem] wide:items-start grid gap-x-10 gap-y-4">
        <section className="flex min-w-0 flex-col gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t('editor.name')}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      placeholder={t('editor.namePlaceholder')}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="date">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>{t('editor.date')}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          <form.Field name="groupIds">
            {(field) => (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">{t('editor.folders')}</span>
                <FolderPicker
                  session={session}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="songs">
            {(field) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {t('reader.songCount', { count: field.state.value.length })}
                  </span>
                  <Sheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                    <SheetTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="lg:hidden">
                        <SectionPlus />
                        {t('editor.addSongs')}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="p-4 data-[side=bottom]:h-[85svh]">
                      <SheetHeader className="p-0">
                        <SheetTitle>{t('editor.addSongs')}</SheetTitle>
                      </SheetHeader>
                      <SongPicker
                        selectedIds={new Set(field.state.value.map(({ _id }) => _id))}
                        onToggle={(song) => field.handleChange(toggleSong(field.state.value, song))}
                      />
                    </SheetContent>
                  </Sheet>
                </div>
                <EditorSongList songs={field.state.value} onChange={field.handleChange} />
              </div>
            )}
          </form.Field>

          {isEditing && canDelete ? (
            <div className="border-t pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" className="text-destructive">
                    <Trash />
                    {t('editor.delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('editor.deleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('editor.deleteDescription')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={remove.isPending}
                      onClick={() => void handleDelete()}
                    >
                      {t('editor.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : null}
        </section>

        <aside className="glass wide:sticky wide:top-7 wide:block hidden h-[calc(100svh-6rem)] min-h-96 p-4 [--glass-r:24px]">
          <h2 className="text-ink-2 mb-3 px-1 text-[0.9375rem] font-semibold">
            {t('editor.addSongs')}
          </h2>
          <form.Subscribe selector={(state) => state.values.songs}>
            {(songs) => (
              <div className="h-[calc(100%-2rem)]">
                <SongPicker
                  selectedIds={new Set(songs.map(({ _id }) => _id))}
                  onToggle={(song) => form.setFieldValue('songs', toggleSong(songs, song))}
                />
              </div>
            )}
          </form.Subscribe>
        </aside>
      </div>
    </form>
  );
}

const toggleSong = (songs: EditorSong[], song: SongSummary): EditorSong[] =>
  songs.some(({ _id }) => _id === song._id)
    ? songs.filter(({ _id }) => _id !== song._id)
    : [...songs, toEditorSong(song)];
