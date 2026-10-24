import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ResetPage } from '@/features/auth/reset-page';

const resetSearchSchema = z.object({
  token: z.string().optional().catch(undefined),
  error: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/reset')({
  validateSearch: resetSearchSchema,
  component: ResetRoute,
});

function ResetRoute() {
  const { token, error } = Route.useSearch();
  return <ResetPage token={error ? undefined : token} />;
}
