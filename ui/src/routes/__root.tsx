import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  Link,
  Outlet,
} from '@tanstack/react-router';
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { isStaleChunkError, reloadForStaleChunk } from '@/lib/reload-on-stale-chunk';
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

function RootError({ error }: ErrorComponentProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (isStaleChunkError(error)) reloadForStaleChunk();
  }, [error]);
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground">{t('errors.generic')}</p>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>{t('errors.reload')}</Button>
        <Button asChild variant="outline">
          <Link to="/">{t('errors.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
