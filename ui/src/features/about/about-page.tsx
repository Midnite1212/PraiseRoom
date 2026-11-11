import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { BrandMark } from '@/components/primitives/brand-mark';
import { followStoredLanguage } from '@/i18n';

import { ABOUT_SECTIONS, AboutHeader } from './about-header';
import { ChordedHeading } from './chorded-heading';
import { DemoSection } from './demo-section';
import { FaqSection } from './faq-section';
import { FeaturesSection } from './features-section';
import { FeedbackSection } from './feedback-section';
import { GuidesSection } from './guides-section';
import { AboutHero } from './hero';
import { TeamSection } from './team-section';

function AboutFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-hairline relative z-[1] mt-28 border-t">
      <div className="wide:px-10 mx-auto grid max-w-[1320px] gap-8 px-(--pg) pt-12 pb-[max(40px,env(safe-area-inset-bottom))]">
        <ChordedHeading
          as="p"
          text={t('about.hero.devicesCaption')}
          chords={['G', 'C', 'D']}
          musicKey="G"
          className="text-headline m-0 max-w-[18ch] font-bold tracking-[-0.03em]"
        />
        <div className="wide:flex-row wide:items-center flex flex-col justify-between gap-5">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span>
              <span className="block font-bold">{t('app.name')}</span>
              <span className="text-ink-3 block font-mono text-xs">
                {t('about.footer.domain')} · {t('about.footer.copyright')}
              </span>
            </span>
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
            {ABOUT_SECTIONS.map((section) => (
              <li key={section}>
                <a
                  href={`#${section}`}
                  className="text-ink-2 hover:text-ink text-sm font-semibold transition-colors"
                >
                  {t(`about.nav.${section}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function AboutPage() {
  useEffect(() => followStoredLanguage(), []);
  return (
    <div className="bg-ground text-ink relative min-h-svh overflow-x-clip">
      <div aria-hidden className="ground-wash pointer-events-none fixed inset-0 z-0" />
      <AboutHeader />
      <main className="relative z-[1]">
        <AboutHero />
        <FeaturesSection />
        <DemoSection />
        <GuidesSection />
        <FeedbackSection />
        <TeamSection />
        <FaqSection />
      </main>
      <AboutFooter />
    </div>
  );
}
