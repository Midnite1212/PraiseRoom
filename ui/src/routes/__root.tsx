import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { RouterContext } from '@/router';

const Devtools = import.meta.env.DEV
  ? lazy(() => import('@/components/layout/devtools'))
  : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground">{t('errors.notFound')}</p>
      <Button asChild>
        <Link to="/">{t('errors.goHome')}</Link>
      </Button>
    </div>
  );
}

function RootError() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground">{t('errors.generic')}</p>
      <Button asChild>
        <Link to="/">{t('errors.goHome')}</Link>
      </Button>
    </div>
  );
}
