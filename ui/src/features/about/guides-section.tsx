import { useTranslation } from 'react-i18next';

import { HowToGuides } from './how-to-guides';
import { SectionHead } from './section-head';

export function GuidesSection() {
  const { t } = useTranslation();
  return (
    <section
      id="guides"
      aria-labelledby="guides-title"
      className="wide:px-10 mx-auto max-w-[1320px] scroll-mt-16 px-(--pg) pt-28"
    >
      <SectionHead
        id="guides-title"
        eyebrow={t('about.guides.eyebrow')}
        title={t('about.guides.title')}
        chords={['C', 'G', 'D']}
        lede={t('about.guides.lede')}
      />
      <HowToGuides className="wide:grid-cols-2 roomy:grid-cols-3" />
    </section>
  );
}
