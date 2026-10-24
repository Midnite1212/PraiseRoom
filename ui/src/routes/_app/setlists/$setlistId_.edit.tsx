import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { setlistQueryOptions } from '@/features/setlists/api';
import { draftFromSetlist } from '@/features/setlists/editor/setlist-draft';
import { SetlistEditor } from '@/features/setlists/editor/setlist-editor';
import { canEditSetlist } from '@/features/setlists/permissions';
import { ensureOrNotFound } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/setlists/$setlistId_/edit')({
  loader: async ({ context, params }) => {
    const setlist = await ensureOrNotFound(
      context.queryClient,
      setlistQueryOptions(params.setlistId),
      { fresh: true }
    );
    if (!canEditSetlist(context.session, setlist)) {
      throw redirect({ to: '/setlists/$setlistId', params: { setlistId: params.setlistId } });
    }
    return { now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="mx-auto h-[70svh] max-w-6xl" />,
  component: EditSetlistPage,
});

function EditSetlistPage() {
  const { setlistId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const { now } = Route.useLoaderData();
  const { data: setlist } = useSuspenseQuery(setlistQueryOptions(setlistId));

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
