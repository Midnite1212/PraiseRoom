import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { GroupTitle } from '@/components/page/group-title';
import { Button } from '@/components/ui/button';
import { GuideCard, HowToGuides } from '@/features/about/how-to-guides';
import { MarkedText } from '@/features/about/marked-text';
import { cn } from '@/lib/utils';

const READS = ['nashville', 'capo', 'chart'] as const;
type Read = (typeof READS)[number];

const GRID_CLASSES = 'wide:grid-cols-2 roomy:grid-cols-3';

function ReadBody({ read }: { read: Read }) {
  const { t } = useTranslation();
  return (
    <div className="text-ink-2 grid gap-2.5 text-sm leading-relaxed">
      {Object.values(t(`tools.guides.reads.${read}.body`, { returnObjects: true })).map(
        (paragraph) => (
          <p key={paragraph} className="m-0">
            <MarkedText text={paragraph} />
          </p>
        )
      )}
      {read === 'capo' ? (
        <Button asChild variant="secondary" className="mt-2 justify-self-start">
          <Link to="/tools" search={{ tool: 'capo' }}>
            {t('tools.guides.reads.capo.open')}
            <ArrowRight />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export function ToolsGuides() {
  const { t } = useTranslation();
  return (
    <>
      <GroupTitle first title={t('tools.guides.basics')} />
      <div className={cn('grid items-start gap-3', GRID_CLASSES)}>
        {READS.map((read) => (
          <GuideCard
            key={read}
            kicker={t('tools.guides.kicker')}
            title={t(`tools.guides.reads.${read}.title`)}
          >
            <ReadBody read={read} />
          </GuideCard>
        ))}
      </div>
      <GroupTitle title={t('tools.guides.howTos')} />
      <HowToGuides className={GRID_CLASSES} />
    </>
  );
}
