import { createFileRoute } from '@tanstack/react-router';

import { openPreviewSandbox } from '@/features/about/preview-sandbox';
import { PreviewScreenView } from '@/features/about/preview-screens';
import { previewScreenSchema } from '@/features/about/screens';
import { usePreviewHost } from '@/features/about/use-preview-host';

export const Route = createFileRoute('/about/preview/$screen')({
  params: {
    parse: ({ screen }) => ({ screen: previewScreenSchema.catch('library').parse(screen) }),
    stringify: ({ screen }) => ({ screen }),
  },
  loader: ({ context }) => openPreviewSandbox(context.queryClient),
  component: PreviewRoute,
});

function PreviewRoute() {
  const { screen } = Route.useParams();
  const { now } = Route.useLoaderData();
  usePreviewHost();
  return <PreviewScreenView screen={screen} now={now} />;
}
