import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { AppShell } from '@/components/layout/app-shell';
import { sessionQueryOptions } from '@/features/auth/session';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    // fetchQuery, not ensureQueryData: pages read the session from context, so an invalidated one
    // (after joining a folder, say) has to be refetched here or they keep the old memberships.
    const session = await context.queryClient.fetchQuery(sessionQueryOptions);
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
    return { session };
  },
  component: AppLayout,
});

function AppLayout() {
  const { session } = Route.useRouteContext();
  return (
    <AppShell session={session}>
      <Outlet />
    </AppShell>
  );
}
