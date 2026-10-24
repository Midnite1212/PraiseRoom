import { createFileRoute } from '@tanstack/react-router';

import { AccountPage } from '@/features/account/account-page';

export const Route = createFileRoute('/_app/account/')({
  component: AccountRoute,
});

function AccountRoute() {
  const { session } = Route.useRouteContext();
  return <AccountPage session={session} />;
}
