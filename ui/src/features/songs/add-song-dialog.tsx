import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ClipboardNote, Globe, Music, PenSquare, User } from 'pixelarticons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { keyLabel } from '@/features/chords/theory';
import { createSong } from '@/features/song-import/api';
import { cn } from '@/lib/utils';

import { initialKey } from './key-options';
import { UNKNOWN_ARTIST } from './song-draft';

type StartKind = 'write' | 'paste' | 'web';

type AddSongDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFindOnWeb: (query: string) => void;
};

const NEW_SONG_LYRICS = '{Verse 1}';

// Names a song, then starts it three ways: Write it and Paste a chart create it and open the editor;
// Find on the web hands the name to the import flow, which creates the song once a chart is picked.
export function AddSongDialog({ open, onOpenChange, onFindOnWeb }: AddSongDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({ mutationFn: createSong });

  const form = useForm({
    defaultValues: { title: '', artist: '' },
    validators: {
      onSubmit: z.object({
        title: z.string().trim().min(1, t('songs.add.titleRequired')),
        artist: z.string(),
      }),
    },
    onSubmitMeta: { start: 'write' as StartKind },
    onSubmit: async ({ value, meta, formApi }) => {
      const title = value.title.trim();
      const artist = value.artist.trim();
      if (meta.start === 'web') {
        formApi.reset();
        onOpenChange(false);
        onFindOnWeb([title, artist].join(' ').trim());
        return;
      }
      try {
        const song = await create.mutateAsync({
          title,
          artist: artist || UNKNOWN_ARTIST,
          originalKey: keyLabel(initialKey(null)),
          chordLyrics: NEW_SONG_LYRICS,
          tempo: ['Medium'],
          timeSignature: ['4/4'],
          year: null,
          recommendedKeys: [],
          themes: [],
        });
        await queryClient.invalidateQueries({ queryKey: ['songs', 'search'] });
        formApi.reset();
        onOpenChange(false);
        await navigate({
          to: '/songs/$songId/edit',
          params: { songId: song._id },
          search: meta.start === 'paste' ? { mode: 'text' } : {},
        });
      } catch {
        toast.error(t('songs.add.createFailed'));
      }
    },
  });

  const start = (kind: StartKind) => () => void form.handleSubmit({ start: kind });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="[--dw:520px]">
        <form
          noValidate
          autoComplete="off"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            start('write')();
          }}
        >
          <DialogHeader icon={<Music />}>
            <DialogTitle>{t('songs.add.title')}</DialogTitle>
            <DialogDescription>{t('songs.add.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2.5">
            <form.Field name="title">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="add-song-title" className="sr-only">
                      {t('songs.add.titleLabel')}
                    </FieldLabel>
                    <TextField icon={<Music />}>
                      <input
                        id="add-song-title"
                        value={field.state.value}
                        maxLength={80}
                        placeholder={t('songs.add.titleLabel')}
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        className={FIELD_INPUT}
                      />
                    </TextField>
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="artist">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="add-song-artist" className="sr-only">
                    {t('songs.add.artistLabel')}
                  </FieldLabel>
                  <TextField icon={<User />}>
                    <input
                      id="add-song-artist"
                      value={field.state.value}
                      maxLength={80}
                      placeholder={t('songs.add.artistPlaceholder')}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      className={FIELD_INPUT}
                    />
                  </TextField>
                </Field>
              )}
            </form.Field>
          </div>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <div className="wide:grid-cols-3 grid grid-cols-1 gap-2">
                <StartTile
                  icon={<PenSquare />}
                  title={t('songs.add.write')}
                  hint={t('songs.add.writeHint')}
                  isFirst
                  disabled={isSubmitting}
                  onClick={start('write')}
                />
                <StartTile
                  icon={<ClipboardNote />}
                  title={t('songs.add.paste')}
                  hint={t('songs.add.pasteHint')}
                  disabled={isSubmitting}
                  onClick={start('paste')}
                />
                <StartTile
                  icon={<Globe />}
                  title={t('songs.add.web')}
                  hint={t('songs.add.webHint')}
                  disabled={isSubmitting}
                  onClick={start('web')}
                />
              </div>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const FIELD_INPUT = 'placeholder:text-ink-3 h-full min-w-0 flex-1 bg-transparent outline-none';

function TextField({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="bg-fill-hover [&_svg]:size-icon [&_svg]:text-ink-2 focus-within:ring-ring/50 flex h-12 items-center gap-2.5 rounded-2xl px-3.5 focus-within:ring-3">
      {icon}
      {children}
    </span>
  );
}

function StartTile({
  icon,
  title,
  hint,
  isFirst = false,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  isFirst?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'hover:bg-fill-press wide:grid-cols-1 wide:gap-x-0 wide:p-3.5 grid grid-cols-[24px_minmax(0,1fr)] content-start items-center justify-items-start gap-x-3 gap-y-1 rounded-2xl px-3.5 py-3 text-left transition-colors disabled:pointer-events-none disabled:opacity-60',
        isFirst ? 'bg-fill-on' : 'bg-fill-hover'
      )}
    >
      <span className="text-chord [&_svg]:size-icon wide:row-span-1 wide:mb-2 wide:self-start row-span-2 self-center">
        {icon}
      </span>
      <b className="text-[0.9375rem]">{title}</b>
      <small className="text-ink-2 text-xs leading-snug">{hint}</small>
    </button>
  );
}
