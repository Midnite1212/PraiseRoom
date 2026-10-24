import { createFileRoute } from '@tanstack/react-router';

import { SignInPage } from '@/features/auth/sign-in-page';
import { authSearchSchema, redirectIfSignedIn } from '@/features/auth/signed-out';

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfSignedIn,
  component: SignInRoute,
});

function SignInRoute() {
  const { redirect } = Route.useSearch();
  return <SignInPage redirect={redirect} />;
}
