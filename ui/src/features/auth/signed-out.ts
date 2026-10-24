import { redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { toSafeRedirect } from '@/lib/safe-redirect';
import type { RouterContext } from '@/router';

import { sessionQueryOptions } from './session';

export const authSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

// Sign in and sign up send someone who is already signed in on to where they were going. UX only;
// the server decides what the session may do.
export const redirectIfSignedIn = async ({
  context,
  search,
}: {
  context: RouterContext;
  search: z.infer<typeof authSearchSchema>;
}) => {
  const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
  if (session) {
    throw redirect({ href: toSafeRedirect(search.redirect) });
  }
};
