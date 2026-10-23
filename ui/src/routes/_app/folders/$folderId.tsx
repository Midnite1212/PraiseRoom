import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  Logout,
  MoreHorizontal,
  PenSquare,
  Plus,
  Trash,
  Users,
} from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { AppBarSlot } from '@/components/layout/app-bar-slots';
import { BACK_LINK_CLASSES, BackLabel } from '@/components/page/back-link';
import { PAGE_TITLE_CLASSES } from '@/components/page/page-header';
import { ActionMenu, MenuRow, MenuSeparator } from '@/components/primitives/action-menu';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  deleteFolder,
  FOLDER_RELATED_QUERY_KEYS,
  folderQueryOptions,
  type Person,
  renameFolder,
} from '@/features/folders/api';
import {
  AddPeopleDialog,
  MembersIsland,
  MembersSheet,
  RemoveMemberDialog,
  useFolderMembers,
} from '@/features/folders/folder-members';
import { AddSetlistsDialog, FolderSetlists } from '@/features/folders/folder-setlists';
import { FolderSleeve } from '@/features/folders/folder-sleeve';
import { canDeleteFolder, canEditFolder } from '@/features/folders/permissions';
import { useFolderCover } from '@/features/folders/use-folder-cover';
import type { Folder } from '@/features/setlists/api';
import { ensureOrNotFound } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/folders/$folderId')({
  loader: async ({ context, params }) => {
    await ensureOrNotFound(context.queryClient, folderQueryOptions(params.folderId));
    return { now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="h-96 w-full" />,
  component: FolderPage,
});

type Sheet = 'members' | 'add-people' | 'add-setlists' | 'delete' | null;

function FolderPage() {
  const { t } = useTranslation();
  const { folderId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const { now } = Route.useLoaderData();
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
      <AppBarSlot side="left">
        <Button asChild variant="glass" size="icon-lg" aria-label={t('folders.title')}>
          <Link to="/folders">
            <ChevronLeft />
          </Link>
        </Button>
      </AppBarSlot>
      <AppBarSlot side="right">
        <ActionMenu
          title={folder.groupName}
          trigger={
            <Button variant="glass" size="icon-lg" aria-label={t('folders.actions')}>
              <MoreHorizontal />
            </Button>
          }
        >
          {canEdit ? (
            <>
              <MenuRow onSelect={() => setIsRenaming(true)}>
                <PenSquare />
                {t('folders.rename')}
              </MenuRow>
              <MenuRow onSelect={() => setSheet('add-setlists')}>
                <Plus />
                {t('folders.addSetlists')}
              </MenuRow>
            </>
          ) : null}
          <MenuRow onSelect={() => setSheet('members')}>
            <Users />
            {t('folders.membersTitle')}
          </MenuRow>
          {isMember || canDelete ? <MenuSeparator /> : null}
          {isMember ? (
            <MenuRow tone="danger" onSelect={leave}>
              <Logout />
              {t('folders.leaveFolder')}
            </MenuRow>
          ) : null}
          {canDelete ? (
            <MenuRow tone="danger" onSelect={() => setSheet('delete')}>
              <Trash />
              {t('folders.delete')}
            </MenuRow>
          ) : null}
        </ActionMenu>
      </AppBarSlot>

      <Link to="/folders" className={BACK_LINK_CLASSES}>
        <BackLabel>{t('folders.title')}</BackLabel>
      </Link>
      <div className="mb-2 flex items-end gap-[22px]">
        <FolderSleeve cells={cells} size="hero" />
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <RenameFolderForm folder={folder} onDone={() => setIsRenaming(false)} />
          ) : (
            <div className="flex items-center gap-1">
              <h1 data-page-title className={PAGE_TITLE_CLASSES}>
                {folder.groupName}
              </h1>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
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
            className="bg-fill-hover hover:bg-fill-press wide:hidden [&>svg]:size-icon mt-3 inline-flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 text-[0.8125rem] font-semibold whitespace-nowrap"
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

      <div className="wide:grid-cols-[minmax(0,1fr)_280px] wide:items-start grid gap-x-10 gap-y-2">
        <div className="min-w-0">
          <FolderSetlists
            session={session}
            folder={folder}
            canEdit={canEdit}
            now={now}
            onAddSetlists={() => setSheet('add-setlists')}
          />
          {isMember || canDelete ? (
            <div className="border-hairline mt-9 flex flex-wrap gap-2 border-t pt-4">
              <p className="text-ink-3 mb-1 ml-0.5 basis-full text-[0.8125rem]">
                {canDelete ? t('folders.dangerDelete') : t('folders.dangerLeave')}
              </p>
              <div className="glass glass-danger inline-flex gap-0.5 p-1">
                {isMember ? (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/20"
                    onClick={leave}
                  >
                    <Logout />
                    {t('folders.leaveFolder')}
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/20"
                    onClick={() => setSheet('delete')}
                  >
                    <Trash />
                    {t('folders.delete')}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <MembersIsland {...memberProps} />
      </div>

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
            className="border-hairline bg-fill-hover aria-invalid:border-destructive -ml-[9px] w-full min-w-0 rounded-xl border px-2 py-0.5 text-[clamp(1.75rem,1.2rem+2.2vw,2.5rem)] font-bold tracking-[-0.03em] outline-none"
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
      toast.success(t('folders.deleted'));
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
