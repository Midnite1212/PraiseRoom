import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBlocker, useNavigate, useRouter } from '@tanstack/react-router';
import { ListPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

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

import { createSetlist, deleteSetlist, type SetlistInput, updateSetlist } from '../api';
import { fromDateInputValue } from '../format-date';
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
  const remove = useMutation({ mutationFn: deleteSetlist });

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
        await queryClient.invalidateQueries({ queryKey: ['setlists'] });
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
      toast.error(t('editor.deleteFailed'));
      return;
    }
    form.reset();
    queryClient.removeQueries({ queryKey: ['setlists', 'detail', setlistId] });
    await queryClient.invalidateQueries({ queryKey: ['setlists'] });
    toast.success(t('editor.deleted'));
    await navigate({ to: '/setlists' });
  };

  return (
    <form
      noValidate
      className="mx-auto flex max-w-6xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {t(isEditing ? 'editor.editTitle' : 'editor.newTitle')}
        </h1>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => router.history.back()}>
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="bg-sheet flex flex-col gap-4 rounded-xl border p-4 md:p-6">
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
                        <ListPlus />
                        {t('editor.addSongs')}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85svh] p-4">
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
                    <Trash2 />
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

        <aside className="bg-sidebar hidden h-[calc(100svh-10rem)] min-h-96 rounded-xl border p-4 lg:sticky lg:top-[4.5rem] lg:block">
          <h2 className="mb-3 text-sm font-medium">{t('editor.addSongs')}</h2>
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
