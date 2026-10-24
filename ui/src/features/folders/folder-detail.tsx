import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  Logout,
  PenSquare,
  Plus,
  Trash,
  UserPlus,
} from 'pixelarticons/react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { AppBarSlot } from '@/components/layout/app-bar-slots';
import { AvatarStack } from '@/components/primitives/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import {
  deleteFolder,
  FOLDER_RELATED_QUERY_KEYS,
  folderQueryOptions,
  type Person,
  renameFolder,
} from '@/features/folders/api';
import {
  AddPeopleDialog,
  MembersSheet,
  RemoveMemberDialog,
  useFolderMembers,
} from '@/features/folders/folder-members';
import { AddSetlistsDialog, FolderSetlists } from '@/features/folders/folder-setlists';
import { FolderSleeve } from '@/features/folders/folder-sleeve';
import { goneToast } from '@/features/folders/gone-toast';
import { canDeleteFolder, canEditFolder } from '@/features/folders/permissions';
import { useFolderCover } from '@/features/folders/use-folder-cover';
import type { Folder } from '@/features/setlists/api';
import { cn } from '@/lib/utils';

const FOLDER_NAME_CLASSES = 'm-0 leading-[1.08] font-bold tracking-[-0.03em] text-balance';

type Sheet = 'members' | 'add-people' | 'add-setlists' | 'delete' | null;

type FolderDetailProps = {
  folderId: string;
  session: Session;
  now: number;
  inPane?: boolean;
};

// A folder's page: on phones it is the whole route, on wide screens the Folders page opens it in a pane.
export function FolderDetail({ folderId, session, now, inPane = false }: FolderDetailProps) {
  const { t } = useTranslation();
  const { data: folder } = useSuspenseQuery(folderQueryOptions(folderId));
  const { people, members } = useFolderMembers(folder);
  const { cells } = useFolderCover(folder, now);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [removing, setRemoving] = useState<Pick<Person, 'userId' | 'fullName'> | null>(null);

  const canEdit = canEditFolder(session, folder);
  const canDelete = canDeleteFolder(session, folder);
  const isMember = members.some(({ userId }) => userId === session.id);
  const madeByYou = folder.createdBy === session.id;
  const maker = people?.find(({ userId }) => userId === folder.createdBy)?.fullName;
  const leave = () => setRemoving({ userId: session.id, fullName: session.fullName });
  const memberProps = {
    session,
    folder,
    canEdit,
    onAddPeople: () => setSheet('add-people'),
    onRemove: setRemoving,
  };

  return (
    <>
      {inPane ? null : (
        <AppBarSlot side="left">
          <Button asChild variant="glass" size="icon-lg" aria-label={t('folders.title')}>
            <Link to="/folders">
              <ChevronLeft />
            </Link>
          </Button>
        </AppBarSlot>
      )}

      <div className="mb-2 flex items-end gap-[22px]">
        <FolderSleeve cells={cells} size={inPane ? 'pane' : 'hero'} />
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div className={cn(inPane && 'pr-10')}>
              <RenameFolderForm folder={folder} onDone={() => setIsRenaming(false)} />
            </div>
          ) : (
            <div className={cn(inPane && 'pr-10')}>
              {inPane ? (
                <h2 className={cn(FOLDER_NAME_CLASSES, 'inline text-2xl')}>{folder.groupName}</h2>
              ) : (
                <h1 data-page-title className={cn(FOLDER_NAME_CLASSES, 'inline text-[1.75rem]')}>
                  {folder.groupName}
                </h1>
              )}
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-ink-3 hover:text-ink ml-1 align-middle"
                  aria-label={t('folders.rename')}
                  title={t('folders.rename')}
                  onClick={() => setIsRenaming(true)}
                >
                  <PenSquare />
                </Button>
              ) : null}
            </div>
          )}
          <p className="text-ink-2 mt-1.5 text-sm">
            {madeByYou
              ? t('folders.youMadeThis')
              : maker
                ? t('folders.from', { name: maker })
                : null}
            {madeByYou || maker ? ' · ' : null}
            {t('folders.setlists', { count: folder.setlistIds.length })}
          </p>
          <button
            type="button"
            onClick={() => setSheet('members')}
            className="bg-fill-hover hover:bg-fill-press [&>svg]:size-icon mt-3 inline-flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 text-[0.8125rem] font-semibold whitespace-nowrap"
          >
            <AvatarStack
              people={members.map(({ userId, fullName }) => ({ id: userId, name: fullName }))}
              youId={session.id}
              max={4}
            />
            {t('folders.members', { count: members.length })}
            <ChevronRight />
          </button>
        </div>
      </div>

      {canEdit ? (
        <div className="mt-5 mb-6 flex flex-wrap gap-2">
          <Button onClick={() => setSheet('add-setlists')}>
            <Plus />
            {t('folders.addSetlists')}
          </Button>
          <Button variant="secondary" onClick={() => setSheet('add-people')}>
            <UserPlus />
            {t('folders.addPeople')}
          </Button>
        </div>
      ) : null}

      <FolderSetlists session={session} folder={folder} canEdit={canEdit} now={now} />

      {isMember || canDelete ? (
        <section
          aria-label={t('folders.exits')}
          className="border-hairline [&>div+div]:border-hairline mt-10 border-t [&>div+div]:border-t"
        >
          {isMember ? (
            <ExitRow
              title={t('folders.leaveFolder')}
              description={t('folders.leaveHint')}
              action={
                <Button variant="exit" className="h-9 pr-4 pl-3 text-[0.9375rem]" onClick={leave}>
                  <Logout />
                  {t('folders.leave')}
                </Button>
              }
            />
          ) : null}
          {canDelete ? (
            <ExitRow
              title={t('folders.delete')}
              description={t('folders.deleteHint', { count: members.length })}
              action={
                <Button
                  variant="exit"
                  className="h-9 pr-4 pl-3 text-[0.9375rem]"
                  onClick={() => setSheet('delete')}
                >
                  <Trash />
                  {t('folders.deleteAction')}
                </Button>
              }
            />
          ) : null}
        </section>
      ) : null}

      <MembersSheet
        {...memberProps}
        open={sheet === 'members'}
        onOpenChange={(open) => setSheet(open ? 'members' : null)}
      />
      <AddPeopleDialog
        folder={folder}
        open={sheet === 'add-people'}
        onOpenChange={(open) => setSheet(open ? 'add-people' : null)}
      />
      <AddSetlistsDialog
        session={session}
        folder={folder}
        now={now}
        open={sheet === 'add-setlists'}
        onOpenChange={(open) => setSheet(open ? 'add-setlists' : null)}
      />
      <RemoveMemberDialog
        session={session}
        folder={folder}
        person={removing}
        onClose={() => setRemoving(null)}
      />
      <DeleteFolderDialog
        folder={folder}
        open={sheet === 'delete'}
        onOpenChange={(open) => setSheet(open ? 'delete' : null)}
      />
    </>
  );
}

function ExitRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-1 py-4">
      <div className="min-w-0">
        <h3 className="m-0 text-[0.9375rem] font-semibold">{title}</h3>
        <p className="text-ink-2 mt-0.5 text-[0.8125rem]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function RenameFolderForm({ folder, onDone }: { folder: Folder; onDone: () => void }) {
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
      const name = value.groupName.trim();
      if (name === folder.groupName) {
        onDone();
        return;
      }
      try {
        await renameFolder(folder._id, name);
        await Promise.all(
          FOLDER_RELATED_QUERY_KEYS.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey: [...queryKey] })
          )
        );
        toast.success(t('folders.renamed'));
        onDone();
      } catch {
        toast.error(t('folders.saveFailed'));
      }
    },
  });

  return (
    <form
      noValidate
      className="flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="groupName">
        {(field) => (
          <input
            // oxlint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={field.state.value}
            maxLength={60}
            aria-label={t('folders.name')}
            aria-invalid={!field.state.meta.isValid}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onDone();
            }}
            className="border-hairline bg-fill-hover aria-invalid:border-destructive -ml-[9px] w-full min-w-0 rounded-xl border px-2 py-0.5 text-[1.75rem] font-bold tracking-[-0.03em] outline-none"
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" variant="link" disabled={isSubmitting}>
            {t('editor.save')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

function DeleteFolderDialog({
  folder,
  open,
  onOpenChange,
}: {
  folder: Folder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
      goneToast(t('folders.deleted'));
      await navigate({ to: '/folders' });
    },
    onError: () => {
      toast.error(t('folders.deleteFailed'));
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader icon={<Trash />}>
          <AlertDialogTitle>
            {t('folders.deleteTitle', { name: folder.groupName })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('folders.deleteDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive-solid"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            {t('folders.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
