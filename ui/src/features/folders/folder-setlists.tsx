import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ListPlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import type { Session } from '@/features/auth/session';
import { type Folder, setlistsQueryOptions } from '@/features/setlists/api';
import { formatSetlistDate } from '@/features/setlists/format-date';
import { canEditSetlist } from '@/features/setlists/permissions';

import { FOLDER_RELATED_QUERY_KEYS, setFolderSetlists } from './api';

type FolderSetlistsProps = { session: Session; folder: Folder; canEdit: boolean };

export function FolderSetlists({ session, folder, canEdit }: FolderSetlistsProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: setlists, isPending } = useQuery(setlistsQueryOptions());

  const update = useMutation({
    mutationFn: (setlistIds: string[]) => setFolderSetlists(folder._id, setlistIds),
    onSuccess: () =>
      Promise.all(
        FOLDER_RELATED_QUERY_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: [...queryKey] })
        )
      ),
    onError: () => {
      toast.error(t('folders.setlistsFailed'));
    },
  });

  const inFolder = new Set(folder.setlistIds);
  const folderSetlists = (setlists ?? []).filter(({ _id }) => inFolder.has(_id));
  // A folder may newly link only setlists the caller can edit; the server enforces the same rule.
  const addable = (setlists ?? []).filter(
    (setlist) => !inFolder.has(setlist._id) && canEditSetlist(session, setlist)
  );

  return (
    <section
      className="bg-sheet flex flex-col gap-3 rounded-xl border p-4"
      aria-labelledby="folder-setlists"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="folder-setlists" className="font-medium">
          {t('folders.setlists', { count: folder.setlistIds.length })}
        </h2>
        {canEdit ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <ListPlus />
                {t('folders.addSetlists')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              {addable.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('folders.noSetlistsToAdd')}</p>
              ) : (
                <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {addable.map((setlist) => {
                    const id = `add-setlist-${setlist._id}`;
                    return (
                      <li key={setlist._id} className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={false}
                          disabled={update.isPending}
                          onCheckedChange={() => update.mutate([...folder.setlistIds, setlist._id])}
                        />
                        <Label htmlFor={id} className="truncate font-normal">
                          {setlist.name}
                        </Label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : folderSetlists.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">{t('folders.noSetlists')}</p>
      ) : (
        <ul className="divide-y">
          {folderSetlists.map((setlist) => (
            <li key={setlist._id} className="flex items-center gap-2">
              <Link
                to="/setlists/$setlistId"
                params={{ setlistId: setlist._id }}
                className="flex min-w-0 flex-1 flex-col py-2 hover:underline"
              >
                <span className="truncate text-sm font-medium">{setlist.name}</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {formatSetlistDate(setlist.date, i18n.language) ?? t('setlists.noDate')}
                </span>
              </Link>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={update.isPending}
                  aria-label={t('folders.removeSetlist', { name: setlist.name })}
                  onClick={() =>
                    update.mutate(folder.setlistIds.filter((id) => id !== setlist._id))
                  }
                >
                  <X />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
