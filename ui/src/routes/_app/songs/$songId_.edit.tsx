import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { Skeleton } from '@/components/ui/skeleton';
import { canWriteSongs } from '@/features/auth/session';
import { songQueryOptions } from '@/features/songs/api';
import { SongEditor } from '@/features/songs/song-editor';
import { ensureOrNotFound } from '@/lib/ensure-or-not-found';

// `mode=text` asks the editor to open on its Text mode (the Paste a chart start).
const editSearchSchema = z.object({ mode: z.literal('text').optional().catch(undefined) });

export const Route = createFileRoute('/_app/songs/$songId_/edit')({
  validateSearch: editSearchSchema,
  loader: async ({ context, params }) => {
    if (!canWriteSongs(context.session)) {
      throw redirect({ to: '/songs/$songId', params: { songId: params.songId } });
    }
    await ensureOrNotFound(context.queryClient, songQueryOptions(params.songId));
  },
  pendingComponent: () => <Skeleton className="mx-auto h-[70svh] max-w-7xl" />,
  component: EditSongPage,
});

function EditSongPage() {
  const { songId } = Route.useParams();
  const { data: song } = useSuspenseQuery(songQueryOptions(songId));
  return <SongEditor key={song._id} song={song} />;
}
