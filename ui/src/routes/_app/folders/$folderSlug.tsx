import { createFileRoute } from '@tanstack/react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { folderQueryOptions } from '@/features/folders/api';
import { FolderDetail } from '@/features/folders/folder-detail';
import { ensureFromSlug } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/folders/$folderSlug')({
  loader: async ({ context, params }) => {
    const { urlKey } = await ensureFromSlug(
      context.queryClient,
      params.folderSlug,
      folderQueryOptions
    );
    return { urlKey, now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="h-96 w-full" />,
  component: FolderPage,
});

function FolderPage() {
  const { session } = Route.useRouteContext();
  const { urlKey, now } = Route.useLoaderData();
  return <FolderDetail urlKey={urlKey} session={session} now={now} />;
}
