import { createFileRoute, redirect } from '@tanstack/react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { createSetlist, setlistSlug } from '@/features/setlists/api';
import { NEW_SETLIST_INPUT } from '@/features/setlists/editor/setlist-draft';
import i18n from '@/i18n';

// Making the setlist is the point of opening this page, so it must not run when a link is only preloaded.
export const Route = createFileRoute('/_app/setlists/new')({
  beforeLoad: async ({ context, preload }) => {
    if (preload) return;
    const saved = await createSetlist({ ...NEW_SETLIST_INPUT, name: i18n.t('editor.newTitle') });
    await context.queryClient.invalidateQueries({ queryKey: ['setlists'], refetchType: 'none' });
    throw redirect({
      to: '/setlists/$setlistSlug/edit',
      params: { setlistSlug: setlistSlug(saved) },
      replace: true,
    });
  },
  pendingComponent: () => <Skeleton className="mx-auto h-[70svh] max-w-6xl" />,
});
