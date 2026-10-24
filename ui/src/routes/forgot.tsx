import { createFileRoute } from '@tanstack/react-router';

import { ForgotPage } from '@/features/auth/forgot-page';

export const Route = createFileRoute('/forgot')({
  component: ForgotPage,
});
