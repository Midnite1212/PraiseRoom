import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Folder, FolderPlus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import type { Session } from '@/features/auth/session';

import { changeFolderMembers, createFolder, FOLDER_RELATED_QUERY_KEYS, folderSlug } from './api';

type CreateFolderDialogProps = {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateFolderDialog({ session, open, onOpenChange }: CreateFolderDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { groupName: '' },
    validators: {
      onSubmit: z.object({
        groupName: z
          .string()
          .trim()
          .min(1, t('folders.nameRequired'))
          .max(60, t('folders.nameTooLong')),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const folder = await createFolder(value.groupName.trim());
        // The API doesn't make the creator a member, and members are who see the folder's setlists.
        await changeFolderMembers(folder._id, { add: [session.id] });
        await Promise.all(
          FOLDER_RELATED_QUERY_KEYS.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey: [...queryKey] })
          )
        );
        formApi.reset();
        onOpenChange(false);
        toast.success(t('folders.created'));
        await navigate({ to: '/folders/$folderSlug', params: { folderSlug: folderSlug(folder) } });
      } catch {
        toast.error(t('folders.saveFailed'));
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <DialogHeader icon={<FolderPlus />}>
            <DialogTitle>{t('folders.new')}</DialogTitle>
            <DialogDescription>{t('folders.newDescription')}</DialogDescription>
          </DialogHeader>
          <form.Field name="groupName">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="new-folder-name" className="sr-only">
                    {t('folders.name')}
                  </FieldLabel>
                  <span className="bg-fill-hover [&_svg]:size-icon [&_svg]:text-ink-2 flex h-12 items-center gap-2.5 rounded-2xl px-3.5">
                    <Folder />
                    <input
                      id="new-folder-name"
                      value={field.state.value}
                      maxLength={60}
                      placeholder={t('folders.namePlaceholder')}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      className="placeholder:text-ink-3 h-full min-w-0 flex-1 bg-transparent outline-none"
                    />
                  </span>
                  {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                </Field>
              );
            }}
          </form.Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t('editor.cancel')}
              </Button>
            </DialogClose>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {t('folders.create')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
