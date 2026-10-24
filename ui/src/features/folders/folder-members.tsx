import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Close, Link, Logout, Plus, Search, UserPlus, Users } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { LIST_CLASSES, listRowClasses, RowText } from '@/components/page/list-row';
import { InitialAvatar } from '@/components/primitives/avatar';
import { goneToast } from '@/components/primitives/gone-toast';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Session } from '@/features/auth/session';
import type { Folder } from '@/features/setlists/api';

import {
  changeFolderMembers,
  FOLDER_RELATED_QUERY_KEYS,
  inviteQueryOptions,
  inviteUrl,
  membersOf,
  type Person,
  peopleQueryOptions,
} from './api';

export const useFolderMembers = (folder: Folder) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: people, isPending } = useQuery(peopleQueryOptions());
  const change = useMutation({
    mutationFn: (members: { add?: string[]; remove?: string[] }) =>
      changeFolderMembers(folder._id, members),
    onSuccess: () =>
      Promise.all(
        FOLDER_RELATED_QUERY_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: [...queryKey] })
        )
      ),
    onError: () => {
      toast.error(t('folders.membersFailed'));
    },
  });
  return { people, members: membersOf(people ?? [], folder._id), isPending, change };
};

type MembersProps = {
  session: Session;
  folder: Folder;
  canEdit: boolean;
  onAddPeople: () => void;
  onRemove: (person: Person) => void;
};

function MemberRows({ session, folder, canEdit, onRemove }: Omit<MembersProps, 'onAddPeople'>) {
  const { t } = useTranslation();
  const { members, isPending } = useFolderMembers(folder);
  if (isPending) return <Skeleton className="h-24 w-full" />;
  return (
    <ul className={LIST_CLASSES}>
      {members.map((person) => {
        const isYou = person.userId === session.id;
        return (
          <li
            key={person.userId}
            className={listRowClasses(
              'min-h-[52px] grid-cols-[32px_minmax(0,1fr)_auto] px-2 py-1.5'
            )}
          >
            <InitialAvatar name={person.fullName} isYou={isYou} />
            <RowText
              title={isYou ? `${person.fullName} · ${t('folders.you')}` : person.fullName}
              meta={
                person.userId === folder.createdBy ? t('folders.madeThis') : t('folders.member')
              }
            />
            {isYou ? (
              <Button
                variant="link"
                size="sm"
                className="text-danger-quiet hover:text-destructive"
                onClick={() => onRemove(person)}
              >
                {t('folders.leave')}
              </Button>
            ) : canEdit ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('folders.removeMember', { name: person.fullName })}
                title={t('folders.remove')}
                onClick={() => onRemove(person)}
              >
                <Close />
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

// The member list in a dialog, opened from the people strip.
export function MembersSheet({
  open,
  onOpenChange,
  onAddPeople,
  ...props
}: MembersProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const { members } = useFolderMembers(props.folder);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        footer={
          props.canEdit ? (
            <DialogFooter>
              <Button onClick={onAddPeople}>
                <UserPlus />
                {t('folders.addPeople')}
              </Button>
            </DialogFooter>
          ) : null
        }
      >
        <DialogHeader icon={<Users />}>
          <DialogTitle>{t('folders.membersTitle')}</DialogTitle>
          <DialogDescription>
            {t('folders.peopleIn', { count: members.length, name: props.folder.groupName })}
          </DialogDescription>
        </DialogHeader>
        <MemberRows {...props} />
      </DialogContent>
    </Dialog>
  );
}

function InviteLinkRow({ folderId }: { folderId: string }) {
  const { t } = useTranslation();
  const { data } = useQuery(inviteQueryOptions(folderId));
  const url = data ? inviteUrl(data.token) : null;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('folders.inviteCopied'));
    } catch {
      toast.error(t('folders.inviteCopyFailed'));
    }
  };

  return (
    <div className="bg-fill-on flex items-center gap-3 rounded-2xl p-3">
      <span className="bg-fill-hover [&_svg]:size-icon grid size-[52px] shrink-0 place-content-center rounded-[14px]">
        <Link />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block text-sm">{t('folders.inviteLink')}</b>
        {url ? (
          <small className="text-ink-2 block truncate font-mono text-xs">
            {url.replace(/^https?:\/\//, '')}
          </small>
        ) : (
          <Skeleton className="mt-1 h-3.5 w-40 max-w-full" />
        )}
      </div>
      <Button variant="link" size="sm" disabled={!url} onClick={() => void copy()}>
        {t('folders.copy')}
      </Button>
    </div>
  );
}

export function AddPeopleDialog({
  folder,
  open,
  onOpenChange,
}: {
  folder: Folder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { people, members, change } = useFolderMembers(folder);
  const [search, setSearch] = useState('');
  const memberIds = new Set(members.map(({ userId }) => userId));
  const query = search.trim().toLocaleLowerCase();
  const candidates = (people ?? []).filter(
    (person) =>
      !memberIds.has(person.userId) &&
      query !== '' &&
      person.fullName.toLocaleLowerCase().includes(query)
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch('');
        onOpenChange(next);
      }}
    >
      <DialogContent
        footer={
          <DialogFooter>
            <DialogClose asChild>
              <Button>{t('folders.done')}</Button>
            </DialogClose>
          </DialogFooter>
        }
      >
        <DialogHeader icon={<UserPlus />}>
          <DialogTitle>{t('folders.addPeople')}</DialogTitle>
          <DialogDescription>
            {t('folders.addPeopleDescription', { name: folder.groupName })}
          </DialogDescription>
        </DialogHeader>
        <InviteLinkRow folderId={folder._id} />
        <label className="bg-fill-hover [&_svg]:size-icon [&_svg]:text-ink-2 flex h-12 items-center gap-2.5 rounded-2xl px-3.5">
          <Search />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('folders.searchPeople')}
            aria-label={t('folders.searchPeople')}
            autoComplete="off"
            className="placeholder:text-ink-3 h-full min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
        <ul className={LIST_CLASSES}>
          {query === '' ? (
            <li className="text-ink-2 py-4 text-center text-sm">{t('folders.typeToSearch')}</li>
          ) : candidates.length === 0 ? (
            <li className="text-ink-2 py-4 text-center text-sm">{t('folders.noPeople')}</li>
          ) : (
            candidates.map((person) => (
              <li
                key={person.userId}
                className="flex min-h-[60px] items-center gap-3 rounded-2xl px-2.5 py-1.5"
              >
                <InitialAvatar name={person.fullName} />
                <span className="min-w-0 flex-1 truncate font-semibold">{person.fullName}</span>
                <Button
                  variant="link"
                  size="sm"
                  disabled={change.isPending}
                  onClick={() =>
                    void change
                      .mutateAsync({ add: [person.userId] })
                      .then(() =>
                        toast.success(t('folders.memberAdded', { name: person.fullName }))
                      )
                  }
                >
                  <Plus />
                  {t('editor.add')}
                </Button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

// Removing someone else, or leaving (removing yourself, which then returns you to Folders).
export function RemoveMemberDialog({
  session,
  folder,
  person,
  onClose,
}: {
  session: Session;
  folder: Folder;
  person: Pick<Person, 'userId' | 'fullName'> | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { change } = useFolderMembers(folder);
  const isYou = person?.userId === session.id;

  const remove = async () => {
    if (!person) return;
    await change.mutateAsync({ remove: [person.userId] });
    onClose();
    if (isYou) {
      goneToast(t('folders.left', { name: folder.groupName }));
      await navigate({ to: '/folders' });
    } else {
      goneToast(t('folders.memberRemoved', { name: person.fullName }));
    }
  };

  return (
    <AlertDialog open={person !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader icon={isYou ? <Logout /> : <Close />}>
          <AlertDialogTitle>
            {isYou
              ? t('folders.leaveTitle')
              : t('folders.removeTitle', { name: person?.fullName ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isYou ? t('folders.leaveDescription') : t('folders.removeDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive-solid"
            disabled={change.isPending}
            onClick={() => void remove().catch(() => undefined)}
          >
            {isYou ? t('folders.leave') : t('folders.remove')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
