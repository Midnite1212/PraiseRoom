import { Heart } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Tag } from '@/components/primitives/tag';
import { Button } from '@/components/ui/button';

import { SectionHead } from './section-head';

const ROLES = ['musicians', 'leaders', 'developers', 'editors'] as const;

export function TeamSection() {
  const { t } = useTranslation();
  return (
    <section
      id="team"
      aria-labelledby="team-title"
      className="wide:px-10 mx-auto max-w-[1320px] scroll-mt-16 px-(--pg) pt-28"
    >
      <SectionHead
        id="team-title"
        eyebrow={t('about.team.eyebrow')}
        title={t('about.team.title')}
        chords={['G', 'Em', 'C', 'D']}
      />
      <div className="roomy:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] grid gap-3">
        <article className="bg-fill-hover wide:p-8 grid content-start gap-4 rounded-[28px] p-6">
          <h3 className="text-card-title m-0 font-bold tracking-[-0.02em]">
            {t('about.team.cardTitle')}
          </h3>
          <p className="text-ink-2 m-0 max-w-[60ch] leading-relaxed">{t('about.team.body')}</p>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {ROLES.map((role) => (
              <li key={role}>
                <Tag className="h-7 px-3 text-[0.8125rem]">{t(`about.team.roles.${role}`)}</Tag>
              </li>
            ))}
          </ul>
        </article>
        <article
          id="give"
          aria-labelledby="give-title"
          className="bg-fill-on wide:p-8 grid scroll-mt-16 content-start gap-4 rounded-[28px] p-6"
        >
          <h3 id="give-title" className="text-card-title m-0 flex items-center gap-2 font-bold">
            <Heart className="text-brand size-5" />
            {t('about.give.title')}
          </h3>
          <p className="text-ink-2 m-0 leading-relaxed">{t('about.give.body')}</p>
          <div className="flex flex-wrap gap-2">
            <Button disabled>{t('about.give.once')}</Button>
            <Button variant="secondary" disabled>
              {t('about.give.monthly')}
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
