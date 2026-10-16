import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

import { Skeleton } from '@/components/ui/skeleton';
import { setlistQueryOptions } from '@/features/setlists/api';
import { MusicianView } from '@/features/setlists/musician-view/musician-view';
import { ApiError } from '@/lib/api-client';

const musicianSearchSchema = z.object({
  song: z.number().int().min(1).default(1).catch(1),
});

export const Route = createFileRoute('/_app/setlists/$setlistId')({
  validateSearch: musicianSearchSchema,
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(setlistQueryOptions(params.setlistId));
    } catch (error: unknown) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {
        throw notFound();
      }
      throw error;
    }
  },
  pendingComponent: MusicianPending,
  component: MusicianPage,
});

function MusicianPage() {
  const { setlistId } = Route.useParams();
  const { song } = Route.useSearch();
  const { data: setlist } = useSuspenseQuery(setlistQueryOptions(setlistId));
  return <MusicianView key={setlist._id} setlist={setlist} songNumber={song} />;
}

function MusicianPending() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-3">
      <Skeleton className="h-8 w-full" />
      <div className="flex gap-4">
        <Skeleton className="hidden h-[70svh] w-64 lg:block" />
        <Skeleton className="h-[70svh] flex-1" />
      </div>
    </div>
  );
}
