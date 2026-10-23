import { createFileRoute } from '@tanstack/react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { folderQueryOptions } from '@/features/folders/api';
import { FolderDetail } from '@/features/folders/folder-detail';
import { ensureOrNotFound } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/folders/$folderId')({
  loader: async ({ context, params }) => {
    await ensureOrNotFound(context.queryClient, folderQueryOptions(params.folderId));
    return { now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="h-96 w-full" />,
  component: FolderPage,
});

function FolderPage() {
  const { folderId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const { now } = Route.useLoaderData();
  return <FolderDetail folderId={folderId} session={session} now={now} />;
}
