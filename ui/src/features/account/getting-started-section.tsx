import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import {
  GettingStartedList,
  GettingStartedMeter,
  useGettingStarted,
} from '@/features/getting-started/getting-started-list';
import { setGettingStartedDismissed } from '@/features/getting-started/store';
import { SettingsGroup } from '@/features/settings/settings-group';

export function GettingStartedSection({ session }: { session: Session }) {
  const { t } = useTranslation();
  const { progress, stored } = useGettingStarted(session);
  const canShowOnHome = stored.dismissed && !stored.finished && !progress.isComplete;

  const showOnHome = () => {
    setGettingStartedDismissed(session.id, false);
    toast.success(t('gettingStarted.shownOnHome'));
  };

  return (
    <SettingsGroup id="account-getting-started" title={t('gettingStarted.title')}>
      <div className="mt-1 mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <GettingStartedMeter progress={progress} />
        {canShowOnHome ? (
          <Button variant="secondary" onClick={showOnHome}>
            {t('gettingStarted.showOnHome')}
          </Button>
        ) : null}
      </div>
      <GettingStartedList progress={progress} />
    </SettingsGroup>
  );
}
