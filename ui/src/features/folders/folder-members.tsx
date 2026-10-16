import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Session } from '@/features/auth/session';
import type { Folder } from '@/features/setlists/api';

import {
  changeFolderMembers,
  FOLDER_RELATED_QUERY_KEYS,
  membersOf,
  type Person,
  peopleQueryOptions,
} from './api';

type FolderMembersProps = { session: Session; folder: Folder; canEdit: boolean };

export function FolderMembers({ session, folder, canEdit }: FolderMembersProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: people, isPending } = useQuery(peopleQueryOptions());
  const [search, setSearch] = useState('');
  const [leaving, setLeaving] = useState<Person | null>(null);

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

  const members = membersOf(people ?? [], folder._id);
  const memberIds = new Set(members.map(({ userId }) => userId));
  const query = search.trim().toLocaleLowerCase();
  const candidates = (people ?? []).filter(
    (person) =>
      !memberIds.has(person.userId) &&
      query !== '' &&
      person.fullName.toLocaleLowerCase().includes(query)
  );

  const removeMember = async (person: Person) => {
    await change.mutateAsync({ remove: [person.userId] });
    setLeaving(null);
    toast.success(t('folders.memberRemoved', { name: person.fullName }));
    if (person.userId === session.id) await navigate({ to: '/folders' });
  };

  return (
    <section
      className="bg-sheet flex flex-col gap-3 rounded-xl border p-4"
      aria-labelledby="folder-members"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="folder-members" className="font-medium">
          {t('folders.members', { count: members.length })}
        </h2>
        {canEdit ? (
          <Dialog onOpenChange={() => setSearch('')}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus />
                {t('folders.addPeople')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('folders.addPeople')}</DialogTitle>
                <DialogDescription>{t('folders.addPeopleDescription')}</DialogDescription>
              </DialogHeader>
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('folders.searchPeople')}
                aria-label={t('folders.searchPeople')}
              />
              <ul className="max-h-72 overflow-y-auto">
                {query === '' ? (
                  <li className="text-muted-foreground py-4 text-center text-sm">
                    {t('folders.typeToSearch')}
                  </li>
                ) : candidates.length === 0 ? (
                  <li className="text-muted-foreground py-4 text-center text-sm">
                    {t('folders.noPeople')}
                  </li>
                ) : (
                  candidates.map((person) => (
                    <li
                      key={person.userId}
                      className="flex items-center gap-2 border-b py-2 last:border-b-0"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">{person.fullName}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={change.isPending}
                        onClick={() =>
                          void change
                            .mutateAsync({ add: [person.userId] })
                            .then(() =>
                              toast.success(t('folders.memberAdded', { name: person.fullName }))
                            )
                        }
                      >
                        {t('editor.add')}
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <ul className="divide-y">
          {members.map((person) => (
            <li key={person.userId} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {person.fullName}
                {person.userId === session.id ? (
                  <span className="text-muted-foreground"> · {t('folders.you')}</span>
                ) : null}
              </span>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('folders.removeMember', { name: person.fullName })}
                  onClick={() => setLeaving(person)}
                >
                  <UserMinus />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={leaving !== null} onOpenChange={(open) => !open && setLeaving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {leaving?.userId === session.id
                ? t('folders.leaveTitle')
                : t('folders.removeTitle', { name: leaving?.fullName ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {leaving?.userId === session.id
                ? t('folders.leaveDescription')
                : t('folders.removeDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={change.isPending}
              onClick={() => {
                if (leaving) void removeMember(leaving).catch(() => undefined);
              }}
            >
              {t('folders.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
