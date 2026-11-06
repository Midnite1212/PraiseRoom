import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

import { ADMIN_TABS, AdminPage } from '@/features/admin/admin-page';
import { hasAdminPowers } from '@/features/auth/session';

const adminSearchSchema = z.object({
  tab: z.enum(ADMIN_TABS).default('songs').catch('songs'),
});

export const Route = createFileRoute('/_app/admin/')({
  validateSearch: adminSearchSchema,
  beforeLoad: ({ context }) => {
    if (!hasAdminPowers(context.session)) throw notFound();
  },
  component: AdminRoute,
});

function AdminRoute() {
  const { session } = Route.useRouteContext();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <AdminPage
      session={session}
      tab={tab}
      onTabChange={(next) => void navigate({ search: { tab: next }, replace: true })}
    />
  );
}
