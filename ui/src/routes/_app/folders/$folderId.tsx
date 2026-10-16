import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Trash2 } from 'lucide-react';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  deleteFolder,
  FOLDER_RELATED_QUERY_KEYS,
  folderQueryOptions,
  renameFolder,
} from '@/features/folders/api';
import { FolderMembers } from '@/features/folders/folder-members';
import { FolderSetlists } from '@/features/folders/folder-setlists';
import { canDeleteFolder, canEditFolder } from '@/features/folders/permissions';
import type { Folder } from '@/features/setlists/api';
import { ensureOrNotFound } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/folders/$folderId')({
  loader: ({ context, params }) =>
    ensureOrNotFound(context.queryClient, folderQueryOptions(params.folderId)),
  pendingComponent: () => <Skeleton className="mx-auto h-96 max-w-3xl" />,
  component: FolderPage,
});

function FolderPage() {
  const { t } = useTranslation();
  const { folderId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const { data: folder } = useSuspenseQuery(folderQueryOptions(folderId));
  const canEdit = canEditFolder(session, folder);

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link to="/folders">
          <ChevronLeft />
          {t('folders.title')}
        </Link>
      </Button>
      {canEdit ? (
        <RenameFolderForm key={folder.groupName} folder={folder} />
      ) : (
        <h1 className="text-2xl font-semibold">{folder.groupName}</h1>
      )}
      <FolderSetlists session={session} folder={folder} canEdit={canEdit} />
      <FolderMembers session={session} folder={folder} canEdit={canEdit} />
      {canDeleteFolder(session, folder) ? <DeleteFolderButton folder={folder} /> : null}
    </section>
  );
}

function RenameFolderForm({ folder }: { folder: Folder }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: { groupName: folder.groupName },
    validators: {
      onSubmit: z.object({
        groupName: z
          .string()
          .trim()
          .min(1, t('folders.nameRequired'))
          .max(60, t('folders.nameTooLong')),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await renameFolder(folder._id, value.groupName.trim());
        await Promise.all(
          FOLDER_RELATED_QUERY_KEYS.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey: [...queryKey] })
          )
        );
        toast.success(t('folders.renamed'));
      } catch {
        toast.error(t('folders.saveFailed'));
      }
    },
  });

  return (
    <form
      noValidate
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="groupName">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid} className="flex-1">
              <FieldLabel htmlFor="folder-name">{t('folders.name')}</FieldLabel>
              <Input
                id="folder-name"
                value={field.state.value}
                aria-invalid={isInvalid}
                className="text-lg font-semibold"
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
            </Field>
          );
        }}
      </form.Field>
      <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
        {([isSubmitting, isDefaultValue]) => (
          <Button type="submit" variant="outline" disabled={isSubmitting || isDefaultValue}>
            {t('editor.save')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

function DeleteFolderButton({ folder }: { folder: Folder }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const remove = useMutation({
    mutationFn: () => deleteFolder(folder._id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['folders', 'detail', folder._id] });
      await Promise.all(
        FOLDER_RELATED_QUERY_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: [...queryKey] })
        )
      );
      toast.success(t('folders.deleted'));
      await navigate({ to: '/folders' });
    },
    onError: () => {
      toast.error(t('folders.deleteFailed'));
    },
  });

  return (
    <div className="border-t pt-4">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="text-destructive">
            <Trash2 />
            {t('folders.delete')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('folders.deleteTitle', { name: folder.groupName })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('folders.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              {t('folders.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
