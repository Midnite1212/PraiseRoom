import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { Skeleton } from '@/components/ui/skeleton';
import { canWriteSongs } from '@/features/auth/session';
import { songQueryOptions } from '@/features/songs/api';
import { SongEditor } from '@/features/songs/song-editor';
import { ensureFromSlug } from '@/lib/ensure-or-not-found';

// `mode=text` asks the editor to open on its Text mode (the Paste a chart start).
const editSearchSchema = z.object({ mode: z.literal('text').optional().catch(undefined) });

export const Route = createFileRoute('/_app/songs/$songSlug_/edit')({
  validateSearch: editSearchSchema,
  loader: async ({ context, params }) => {
    if (!canWriteSongs(context.session)) {
      throw redirect({ to: '/songs/$songSlug', params: { songSlug: params.songSlug } });
    }
    const { urlKey } = await ensureFromSlug(context.queryClient, params.songSlug, songQueryOptions);
    return { urlKey };
  },
  pendingComponent: () => <Skeleton className="mx-auto h-[70svh] max-w-7xl" />,
  component: EditSongPage,
});

function EditSongPage() {
  const { urlKey } = Route.useLoaderData();
  const { mode } = Route.useSearch();
  const { data: song } = useSuspenseQuery(songQueryOptions(urlKey));
  return <SongEditor key={song._id} song={song} initialMode={mode ?? 'song'} />;
}
