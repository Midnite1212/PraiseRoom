import { createFileRoute } from '@tanstack/react-router';

import { SetlistEditor } from '@/features/setlists/editor/setlist-editor';

export const Route = createFileRoute('/_app/setlists/new')({
  component: NewSetlistPage,
});

function NewSetlistPage() {
  const { session } = Route.useRouteContext();
  return (
    <SetlistEditor
      session={session}
      initialValues={{ name: '', date: '', songs: [], groupIds: [] }}
    />
  );
}
