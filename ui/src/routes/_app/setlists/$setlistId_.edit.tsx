import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { keyForSong, setlistQueryOptions } from '@/features/setlists/api';
import { SetlistEditor } from '@/features/setlists/editor/setlist-editor';
import { toDateInputValue } from '@/features/setlists/format-date';
import { canDeleteSetlist, canEditSetlist } from '@/features/setlists/permissions';
import { ensureOrNotFound } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/setlists/$setlistId_/edit')({
  loader: async ({ context, params }) => {
    const setlist = await ensureOrNotFound(
      context.queryClient,
      setlistQueryOptions(params.setlistId)
    );
    if (!canEditSetlist(context.session, setlist)) {
      throw redirect({ to: '/setlists/$setlistId', params: { setlistId: params.setlistId } });
    }
  },
  pendingComponent: () => <Skeleton className="mx-auto h-[70svh] max-w-6xl" />,
  component: EditSetlistPage,
});

function EditSetlistPage() {
  const { setlistId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const { data: setlist } = useSuspenseQuery(setlistQueryOptions(setlistId));

  return (
    <SetlistEditor
      key={setlist._id}
      session={session}
      setlistId={setlist._id}
      canDelete={canDeleteSetlist(session, setlist)}
      initialValues={{
        name: setlist.name,
        date: toDateInputValue(setlist.date),
        groupIds: setlist.groupIds,
        songs: setlist.songs.map((song) => ({
          _id: song._id,
          title: song.title,
          artist: song.artist,
          originalKey: song.originalKey,
          key: keyForSong(setlist, song),
        })),
      }}
    />
  );
}
