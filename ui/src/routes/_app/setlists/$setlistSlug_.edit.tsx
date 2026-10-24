import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { setlistQueryOptions } from '@/features/setlists/api';
import { draftFromSetlist } from '@/features/setlists/editor/setlist-draft';
import { SetlistEditor } from '@/features/setlists/editor/setlist-editor';
import { canEditSetlist } from '@/features/setlists/permissions';
import { ensureFromSlug } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/setlists/$setlistSlug_/edit')({
  loader: async ({ context, params }) => {
    const { urlKey, record: setlist } = await ensureFromSlug(
      context.queryClient,
      params.setlistSlug,
      setlistQueryOptions,
      { fresh: true }
    );
    if (!canEditSetlist(context.session, setlist)) {
      throw redirect({ to: '/setlists/$setlistSlug', params: { setlistSlug: params.setlistSlug } });
    }
    return { urlKey, now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="mx-auto h-[70svh] max-w-6xl" />,
  component: EditSetlistPage,
});

function EditSetlistPage() {
  const { session } = Route.useRouteContext();
  const { urlKey, now } = Route.useLoaderData();
  const { data: setlist } = useSuspenseQuery(setlistQueryOptions(urlKey));

  return (
    <SetlistEditor
      key={setlist._id}
      session={session}
      setlistId={setlist._id}
      initialDraft={draftFromSetlist(setlist)}
      now={now}
    />
  );
}
