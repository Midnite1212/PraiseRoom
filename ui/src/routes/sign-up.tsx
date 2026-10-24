import { createFileRoute } from '@tanstack/react-router';

import { SignUpPage } from '@/features/auth/sign-up-page';
import { authSearchSchema, redirectIfSignedIn } from '@/features/auth/signed-out';

export const Route = createFileRoute('/sign-up')({
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfSignedIn,
  component: SignUpRoute,
});

function SignUpRoute() {
  const { redirect } = Route.useSearch();
  return <SignUpPage redirect={redirect} />;
}
