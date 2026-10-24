import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/page/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FOLDER_RELATED_QUERY_KEYS, joinFolder } from '@/features/folders/api';
import { ApiError } from '@/lib/api-client';

type JoinFailure = 'invalid' | 'failed';

const toJoinFailure = (error: unknown): JoinFailure =>
  error instanceof ApiError && (error.status === 400 || error.status === 404)
    ? 'invalid'
    : 'failed';

// The `_app` guard has already sent a signed-out visitor to /login?redirect=<this link>, so the
// link shows nothing about the folder until the visitor is signed in and has joined.
export const Route = createFileRoute('/_app/join/$token')({
  beforeLoad: async ({ context, params }) => {
    let groupId: string;
    try {
      ({ groupId } = await joinFolder(params.token));
    } catch (error: unknown) {
      return { joinFailure: toJoinFailure(error) };
    }
    await Promise.all(
      FOLDER_RELATED_QUERY_KEYS.map((queryKey) =>
        context.queryClient.invalidateQueries({ queryKey: [...queryKey] })
      )
    );
    throw redirect({ to: '/folders/$folderId', params: { folderId: groupId } });
  },
  pendingComponent: () => <Skeleton className="h-48 w-full" />,
  component: JoinPage,
});

function JoinPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { joinFailure } = Route.useRouteContext();
  return (
    <EmptyState
      title={joinFailure === 'invalid' ? t('join.invalidTitle') : t('join.failedTitle')}
      className="mx-auto max-w-md"
    >
      <p>{joinFailure === 'invalid' ? t('join.invalidHint') : t('join.failedHint')}</p>
      <div className="mt-4 flex justify-center gap-2">
        {joinFailure === 'failed' ? (
          <Button variant="secondary" onClick={() => void router.invalidate()}>
            {t('join.retry')}
          </Button>
        ) : null}
        <Button asChild>
          <Link to="/folders">{t('join.toFolders')}</Link>
        </Button>
      </div>
    </EmptyState>
  );
}
