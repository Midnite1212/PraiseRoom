import { useForm, useStore } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronDown, Sparkles } from 'pixelarticons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { conventionalKey } from '@/features/chords/key-spelling';
import { keyLabel, type MusicKey, parseKey, transposeChordLyrics } from '@/features/chords/theory';
import { ReaderPreferenceControls } from '@/features/reader/reader-controls';
import type { ReaderSong } from '@/features/reader/song';
import { SongReader } from '@/features/reader/song-reader';
import { songSearchQueryOptions, TEMPO_LABEL_KEYS, TEMPO_OPTIONS } from '@/features/songs/api';
import {
  initialKey,
  KEY_OPTIONS,
  keyOptionValue,
  semitonesToKey,
} from '@/features/songs/key-options';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import {
  createSong,
  type ImportedChart,
  importMetadataQueryOptions,
  TIME_SIGNATURE_OPTIONS,
} from './api';

type ImportFormProps = {
  chart: ImportedChart;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => void;
};

type FormValues = {
  title: string;
  artist: string;
  key: MusicKey;
  tempo: string;
  timeSignature: string;
  year: string;
  chordLyrics: string;
};

// The editable form, preview, and save step shown once a chart has been fetched or converted.
export function ImportForm({ chart, onDirtyChange, onSaved }: ImportFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rawOpen, setRawOpen] = useState(false);
  const [moveChords, setMoveChords] = useState(true);
  const [touched, setTouched] = useState({ tempo: false, timeSignature: false, year: false });
  const [lookup, setLookup] = useState({ title: chart.title.trim(), artist: chart.artist.trim() });

  const metadata = useQuery(importMetadataQueryOptions(lookup.title, lookup.artist));
  const save = useMutation({ mutationFn: createSong });

  const schema = z.object({
    title: z.string().trim().min(1, t('songImport.form.titleRequired')),
    artist: z.string().trim().min(1, t('songImport.form.artistRequired')),
    key: z.custom<MusicKey>(),
    tempo: z.string(),
    timeSignature: z.string(),
    year: z
      .string()
      .refine((value) => value === '' || /^\d{3,4}$/.test(value), t('songImport.form.yearInvalid')),
    chordLyrics: z.string(),
  });

  const defaultValues: FormValues = {
    title: chart.title,
    artist: chart.artist,
    key: initialKey(chart.originalKey),
    tempo: '',
    timeSignature: '',
    year: '',
    chordLyrics: chart.chordLyrics,
  };

  const form = useForm({
    defaultValues,
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      let saved: Awaited<ReturnType<typeof createSong>>;
      try {
        saved = await save.mutateAsync({
          title: value.title.trim(),
          artist: value.artist.trim(),
          originalKey: keyLabel(value.key),
          chordLyrics: value.chordLyrics,
          tempo: value.tempo ? [value.tempo] : [],
          timeSignature: value.timeSignature ? [value.timeSignature] : [],
          year: value.year || null,
          recommendedKeys: [],
          themes: [],
        });
      } catch {
        toast.error(t('songImport.form.saveFailed'));
        return;
      }
      formApi.reset(value);
      toast.success(t('songImport.form.saved'));
      onSaved();
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      await navigate({ to: '/songs/$songId', params: { songId: saved._id } });
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  // The lookup is slow, so it runs on the title and artist the user settles on, not on each keystroke.
  const commitLookup = () => {
    const next = {
      title: form.getFieldValue('title').trim(),
      artist: form.getFieldValue('artist').trim(),
    };
    if (next.title && next.artist) setLookup(next);
  };
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!metadata.data) return;
    if (!touched.tempo && metadata.data.tempo) {
      form.setFieldValue('tempo', metadata.data.tempo, { dontUpdateMeta: true });
    }
    if (!touched.timeSignature && metadata.data.timeSignature) {
      form.setFieldValue('timeSignature', metadata.data.timeSignature, {
        dontUpdateMeta: true,
      });
    }
    if (!touched.year && metadata.data.year) {
      form.setFieldValue('year', metadata.data.year, { dontUpdateMeta: true });
    }
  }, [metadata.data, touched, form]);

  const applyKey = (newKey: MusicKey) => {
    const current = form.getFieldValue('key');
    const semitones = moveChords ? semitonesToKey(current, newKey) : 0;
    form.setFieldValue('chordLyrics', (text) =>
      transposeChordLyrics(text, semitones, newKey.prefersFlats)
    );
    form.setFieldValue('key', newKey);
  };

  const bpm = metadata.data?.bpm ?? chart.bpm;
  const recordingKeyLabel = metadata.data?.recordingKey ?? null;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <SourceLink chart={chart} />

      <div className="wide:grid-cols-[22rem_minmax(0,1fr)] grid gap-4">
        <section className="flex flex-col gap-4">
          <FieldGroup className="grid gap-4">
            <form.Field name="title">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t('songImport.form.title')}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={() => {
                        field.handleBlur();
                        commitLookup();
                      }}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.title}>
              {(title) => <DuplicateWarning title={title} />}
            </form.Subscribe>

            <form.Field name="artist">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t('songImport.form.artist')}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={() => {
                        field.handleBlur();
                        commitLookup();
                      }}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>

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
                  <div className="flex items-center gap-2">
                    <Switch id="move-chords" checked={moveChords} onCheckedChange={setMoveChords} />
                    <Label htmlFor="move-chords" className="text-muted-foreground font-normal">
                      {t('songImport.form.moveChords')}
                    </Label>
                  </div>
                </Field>
              )}
            </form.Field>

            {metadata.isFetching ? (
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Sparkles className="size-3.5" />
                {t('songImport.form.metadataLoading')}
              </p>
            ) : null}

            {recordingKeyLabel ? (
              <form.Subscribe selector={(state) => state.values.key}>
                {(currentKey) => (
                  <RecordingKeySuggestion
                    recordingKeyLabel={recordingKeyLabel}
                    currentKey={currentKey}
                    onApply={applyKey}
                  />
                )}
              </form.Subscribe>
            ) : null}

            {bpm !== null && bpm >= 130 ? (
              <p className="text-muted-foreground text-xs">
                {t('songImport.form.doubleTimeHint', { bpm })}
              </p>
            ) : null}

            <div className="wide:grid-cols-2 grid gap-4">
              <form.Field name="tempo">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>{t('songImport.form.tempo')}</FieldLabel>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(value) => {
                        setTouched((prev) => ({ ...prev, tempo: true }));
                        field.handleChange(value);
                      }}
                    >
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
                    <FieldLabel htmlFor={field.name}>
                      {t('songImport.form.timeSignature')}
                    </FieldLabel>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(value) => {
                        setTouched((prev) => ({ ...prev, timeSignature: true }));
                        field.handleChange(value);
                      }}
                    >
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
                      onChange={(event) => {
                        setTouched((prev) => ({ ...prev, year: true }));
                        field.handleChange(event.target.value);
                      }}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <form.Field name="chordLyrics">
            {(field) => (
              <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="self-start">
                    <ChevronDown className={rawOpen ? 'rotate-180' : ''} />
                    {t('songImport.form.editRaw')}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Textarea
                    rows={14}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    className="font-mono text-xs"
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {t('songImport.form.save')}
              </Button>
            )}
          </form.Subscribe>
        </section>

        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex justify-end gap-1.5">
            <ReaderPreferenceControls />
          </div>
          <form.Subscribe
            selector={(state) => ({
              title: state.values.title,
              artist: state.values.artist,
              key: state.values.key,
              chordLyrics: state.values.chordLyrics,
            })}
          >
            {(preview) => <ImportPreview preview={preview} onKeyChange={applyKey} />}
          </form.Subscribe>
        </section>
      </div>
    </form>
  );
}

type PreviewValues = { title: string; artist: string; key: MusicKey; chordLyrics: string };

function ImportPreview({
  preview,
  onKeyChange,
}: {
  preview: PreviewValues;
  onKeyChange: (key: MusicKey) => void;
}) {
  const { t } = useTranslation();
  const song: ReaderSong = {
    _id: 'preview',
    title: preview.title || t('songImport.form.untitled'),
    artist: preview.artist,
    originalKey: keyLabel(preview.key),
    chordLyrics: preview.chordLyrics,
    code: null,
    year: null,
    tempo: [],
    timeSignature: [],
    themes: [],
  };
  return <SongReader song={song} playKey={preview.key} onPlayKeyChange={onKeyChange} />;
}

function RecordingKeySuggestion({
  recordingKeyLabel,
  currentKey,
  onApply,
}: {
  recordingKeyLabel: string;
  currentKey: MusicKey;
  onApply: (key: MusicKey) => void;
}) {
  const { t } = useTranslation();
  const parsed = parseKey(recordingKeyLabel);
  if (!parsed) return null;
  const recordingKey = conventionalKey(parsed.root, parsed.isMinor);
  if (recordingKey.root === currentKey.root && recordingKey.isMinor === currentKey.isMinor) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={() => onApply(recordingKey)}
      className="text-primary w-fit text-left text-xs underline-offset-2 hover:underline"
    >
      {t('songImport.form.recordingKeySuggestion', { key: keyLabel(recordingKey) })}
    </button>
  );
}

function DuplicateWarning({ title }: { title: string }) {
  const { t } = useTranslation();
  const debouncedTitle = useDebouncedValue(title.trim(), 300);
  const { data } = useQuery({
    ...songSearchQueryOptions({ keyword: debouncedTitle, page: 1 }),
    enabled: debouncedTitle.length > 1,
  });
  const duplicate = data?.data.find(
    (song) => song.title.toLowerCase() === debouncedTitle.toLowerCase()
  );
  if (!duplicate) return null;
  return (
    <Alert>
      <AlertDescription className="flex flex-wrap items-center gap-1.5">
        <span>{t('songImport.form.duplicateWarning', { title: duplicate.title })}</span>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link to="/songs/$songId" params={{ songId: duplicate._id }}>
            {t('songImport.form.duplicateLink')}
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function SourceLink({ chart }: { chart: ImportedChart }) {
  const { t } = useTranslation();
  if (!chart.url || chart.source === 'text') return null;
  return (
    <a
      href={chart.url}
      target="_blank"
      rel="noreferrer"
      className="text-muted-foreground w-fit text-xs underline-offset-2 hover:underline"
    >
      {t('songImport.form.viewSource', { source: t(`songImport.sources.${chart.source}`) })}
    </a>
  );
}
