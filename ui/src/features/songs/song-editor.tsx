import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useBlocker, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { keyLabel, type MusicKey, transposeChordLyrics } from '@/features/chords/theory';
import type { ReaderSong } from '@/features/reader/song';
import { ReaderPreferenceControls, SongReader } from '@/features/reader/song-reader';
import { TIME_SIGNATURE_OPTIONS } from '@/features/song-import/api';

import { type Song, type SongInput, TEMPO_LABEL_KEYS, TEMPO_OPTIONS, updateSong } from './api';
import { initialKey, KEY_OPTIONS, keyOptionValue, semitonesToKey } from './key-options';

const NO_CAPO = '0';
const CAPO_OPTIONS = Array.from({ length: 12 }, (_, fret) => String(fret));

type FormValues = {
  title: string;
  artist: string;
  key: MusicKey;
  tempo: string;
  timeSignature: string;
  year: string;
  capo: string;
  chordLyrics: string;
};

const toFormValues = (song: Song): FormValues => ({
  title: song.title,
  artist: song.artist,
  key: initialKey(song.originalKey),
  tempo: song.tempo[0] ?? '',
  timeSignature: song.timeSignature[0] ?? '',
  year: song.year ?? '',
  capo: song.capo ? String(song.capo) : NO_CAPO,
  chordLyrics: song.chordLyrics,
});

// Edits one song for editors and admins; the server's SONG_WRITERS rule is the real gate.
export function SongEditor({ song }: { song: Song }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [moveChords, setMoveChords] = useState(true);
  const save = useMutation({ mutationFn: (input: SongInput) => updateSong(song._id, input) });

  const schema = z.object({
    title: z.string().trim().min(1, t('songImport.form.titleRequired')),
    artist: z.string().trim().min(1, t('songImport.form.artistRequired')),
    key: z.custom<MusicKey>(),
    tempo: z.string(),
    timeSignature: z.string(),
    year: z
      .string()
      .refine((value) => value === '' || /^\d{3,4}$/.test(value), t('songImport.form.yearInvalid')),
    capo: z.string(),
    chordLyrics: z.string(),
  });

  const form = useForm({
    defaultValues: toFormValues(song),
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await save.mutateAsync({
          title: value.title.trim(),
          artist: value.artist.trim(),
          originalKey: keyLabel(value.key),
          chordLyrics: value.chordLyrics,
          tempo: value.tempo ? [value.tempo] : [],
          timeSignature: value.timeSignature ? [value.timeSignature] : [],
          year: value.year || null,
          capo: Number(value.capo) || null,
        });
      } catch {
        toast.error(t('songEditor.saveFailed'));
        return;
      }
      formApi.reset(value);
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success(t('songEditor.saved'));
      await navigate({ to: '/songs/$songId', params: { songId: song._id } });
    },
  });

  useBlocker({
    shouldBlockFn: () =>
      form.state.isDirty && !form.state.isSubmitting && !window.confirm(t('editor.leaveConfirm')),
  });

  const applyKey = (newKey: MusicKey) => {
    const current = form.getFieldValue('key');
    const semitones = moveChords ? semitonesToKey(current, newKey) : 0;
    form.setFieldValue('chordLyrics', (text) =>
      transposeChordLyrics(text, semitones, newKey.prefersFlats)
    );
    form.setFieldValue('key', newKey);
  };

  return (
    <form
      noValidate
      className="mx-auto flex max-w-7xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t('songEditor.heading')}</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/songs/$songId" params={{ songId: song._id }}>
              {t('songEditor.cancel')}
            </Link>
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {t('songEditor.save')}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <FieldGroup className="grid content-start gap-4">
          {(['title', 'artist'] as const).map((name) => (
            <form.Field key={name} name={name}>
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t(`songImport.form.${name}`)}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="key">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>{t('songImport.form.key')}</FieldLabel>
                  <Select
                    value={keyOptionValue(field.state.value)}
                    onValueChange={(value) => {
                      const option = KEY_OPTIONS.find((key) => keyOptionValue(key) === value);
                      if (option) applyKey(option);
                    }}
                  >
                    <SelectTrigger id={field.name} className="w-full font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KEY_OPTIONS.map((option) => (
                        <SelectItem
                          key={keyOptionValue(option)}
                          value={keyOptionValue(option)}
                          className="font-mono"
                        >
                          {keyLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <form.Field name="capo">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>{t('songEditor.capo')}</FieldLabel>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAPO_OPTIONS.map((fret) => (
                        <SelectItem key={fret} value={fret}>
                          {fret === NO_CAPO ? t('songEditor.noCapo') : fret}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="move-chords" checked={moveChords} onCheckedChange={setMoveChords} />
            <Label htmlFor="move-chords" className="text-muted-foreground font-normal">
              {t('songImport.form.moveChords')}
            </Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="tempo">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>{t('songImport.form.tempo')}</FieldLabel>
                  <Select value={field.state.value || undefined} onValueChange={field.handleChange}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder={t('songImport.form.tempoPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPO_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(TEMPO_LABEL_KEYS[option])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <form.Field name="timeSignature">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>{t('songImport.form.timeSignature')}</FieldLabel>
                  <Select value={field.state.value || undefined} onValueChange={field.handleChange}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder={t('songImport.form.timeSignaturePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SIGNATURE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="year">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="max-w-32">
                  <FieldLabel htmlFor={field.name}>{t('songImport.form.year')}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    inputMode="numeric"
                    value={field.state.value}
                    aria-invalid={isInvalid}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="chordLyrics">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>{t('songEditor.chordLyrics')}</FieldLabel>
                <Textarea
                  id={field.name}
                  rows={18}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className="font-mono text-xs"
                />
                <FieldDescription>{t('songEditor.chordLyricsHint')}</FieldDescription>
              </Field>
            )}
          </form.Field>
        </FieldGroup>

        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex justify-end gap-1.5">
            <ReaderPreferenceControls />
          </div>
          <form.Subscribe selector={(state) => state.values}>
            {(values) => <EditorPreview song={song} values={values} onKeyChange={applyKey} />}
          </form.Subscribe>
        </section>
      </div>
    </form>
  );
}

function EditorPreview({
  song,
  values,
  onKeyChange,
}: {
  song: Song;
  values: FormValues;
  onKeyChange: (key: MusicKey) => void;
}) {
  const preview: ReaderSong = {
    ...song,
    title: values.title,
    artist: values.artist,
    originalKey: keyLabel(values.key),
    chordLyrics: values.chordLyrics,
    tempo: values.tempo ? [values.tempo] : [],
    timeSignature: values.timeSignature ? [values.timeSignature] : [],
    year: values.year || null,
    capo: Number(values.capo) || null,
  };
  return (
    <SongReader
      song={preview}
      playKey={values.key}
      onPlayKeyChange={onKeyChange}
      stickyUnder="app"
    />
  );
}
