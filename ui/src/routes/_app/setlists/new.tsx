import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { Skeleton } from '@/components/ui/skeleton';
import { canEditFolder } from '@/features/folders/permissions';
import { createSetlist, foldersQueryOptions, setlistSlug } from '@/features/setlists/api';
import { NEW_SETLIST_INPUT } from '@/features/setlists/editor/setlist-draft';
import i18n from '@/i18n';

const newSetlistSearchSchema = z.object({
  folder: z
    .string()
    .regex(/^[0-9a-f]{24}$/i)
    .optional()
    .catch(undefined),
});

// Making the setlist is the point of opening this page, so it must not run when a link is only preloaded.
export const Route = createFileRoute('/_app/setlists/new')({
  validateSearch: newSetlistSearchSchema,
  beforeLoad: async ({ context, preload, search }) => {
    if (preload) return;
    const folders = search.folder
      ? await context.queryClient.ensureQueryData(foldersQueryOptions())
      : [];
    const folder = folders.find(({ _id }) => _id === search.folder);
    const saved = await createSetlist({
      ...NEW_SETLIST_INPUT,
      name: i18n.t('editor.newTitle'),
      groupIds: folder && canEditFolder(context.session, folder) ? [folder._id] : [],
    });
    await Promise.all(
      [['setlists'], ['folders']].map((queryKey) =>
        context.queryClient.invalidateQueries({ queryKey, refetchType: 'none' })
      )
    );
    throw redirect({
      to: '/setlists/$setlistSlug/edit',
      params: { setlistSlug: setlistSlug(saved) },
      replace: true,
    });
  },
  pendingComponent: () => <Skeleton className="mx-auto h-[70svh] max-w-6xl" />,
});
