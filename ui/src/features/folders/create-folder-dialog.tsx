import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FolderPlus } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Session } from '@/features/auth/session';

import { changeFolderMembers, createFolder, FOLDER_RELATED_QUERY_KEYS } from './api';

export function CreateFolderDialog({ session }: { session: Session }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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
        setIsOpen(false);
        toast.success(t('folders.created'));
        await navigate({ to: '/folders/$folderId', params: { folderId: folder._id } });
      } catch {
        toast.error(t('folders.saveFailed'));
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <FolderPlus />
          {t('folders.new')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('folders.new')}</DialogTitle>
            <DialogDescription>{t('folders.newDescription')}</DialogDescription>
          </DialogHeader>
          <form.Field name="groupName">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="new-folder-name">{t('folders.name')}</FieldLabel>
                  <Input
                    id="new-folder-name"
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
          <DialogFooter>
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
