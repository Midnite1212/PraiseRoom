import { Check, Close } from 'pixelarticons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import {
  GettingStartedList,
  GettingStartedMeter,
  useGettingStarted,
} from '@/features/getting-started/getting-started-list';
import { homeCardView } from '@/features/getting-started/steps';
import { finishGettingStarted, setGettingStartedDismissed } from '@/features/getting-started/store';

const CARD_CLASSES = 'border-hairline mb-2 rounded-[28px] border p-[18px]';

// The getting-started steps on Home until they are all done or hidden; Account always lists them.
export function GettingStartedCard({ session }: { session: Session }) {
  const { t } = useTranslation();
  const { progress, stored } = useGettingStarted(session);
  const [isCelebrating, setIsCelebrating] = useState(
    () => progress.isComplete && !stored.finished && !stored.dismissed
  );

  useEffect(() => {
    if (progress.isComplete) finishGettingStarted(session.id);
  }, [progress.isComplete, session.id]);

  const view = homeCardView(progress, stored, isCelebrating);
  if (view === 'hidden') return null;

  if (view === 'finished') {
    return (
      <section
        aria-labelledby="getting-started-done"
        className={`${CARD_CLASSES} grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3`}
      >
        <span className="bg-fill-on text-ok grid size-7 place-items-center rounded-full">
          <Check aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="getting-started-done" className="m-0 font-semibold">
            {t('gettingStarted.finishedTitle')}
          </h2>
          <p className="text-ink-2 mt-0.5 text-[0.8125rem]">{t('gettingStarted.finishedBody')}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('gettingStarted.close')}
          onClick={() => setIsCelebrating(false)}
        >
          <Close />
        </Button>
      </section>
    );
  }

  const hide = () => {
    setGettingStartedDismissed(session.id, true);
    toast(t('gettingStarted.hidden'));
  };

  return (
    <section aria-labelledby="getting-started" className={CARD_CLASSES}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 px-1">
          <h2 id="getting-started" className="text-card-title m-0 font-bold tracking-[-0.02em]">
            {t('gettingStarted.title')}
          </h2>
          <p className="text-ink-2 mt-1 text-sm">{t('gettingStarted.intro')}</p>
          <div className="mt-2.5">
            <GettingStartedMeter progress={progress} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('gettingStarted.hide')}
          onClick={hide}
          className="-mt-1 -mr-1.5"
        >
          <Close />
        </Button>
      </div>
      <GettingStartedList progress={progress} className="roomy:grid roomy:grid-cols-2 mt-3" />
    </section>
  );
}
