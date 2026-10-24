import { createFileRoute } from '@tanstack/react-router';

import { CheckEmailPage } from '@/features/auth/check-email-page';

export const Route = createFileRoute('/check-email')({
  component: CheckEmailPage,
});
