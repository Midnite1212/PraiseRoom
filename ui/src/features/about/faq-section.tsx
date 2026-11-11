import { Plus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { SectionHead } from './section-head';

const QUESTIONS = ['cost', 'join', 'chinese', 'stage', 'publicLink', 'missingSong'] as const;

export function FaqSection() {
  const { t } = useTranslation();
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="wide:px-10 mx-auto max-w-[1320px] scroll-mt-16 px-(--pg) pt-28"
    >
      <div className="roomy:grid roomy:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] roomy:gap-12">
        <SectionHead id="faq-title" title={t('about.faq.title')} chords={['Am', 'D', 'G']} />
        <div className="border-hairline border-t">
          {QUESTIONS.map((question) => (
            <details key={question} className="group border-hairline border-b">
              <summary className="flex cursor-pointer list-none items-center gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{t(`about.faq.${question}.q`)}</span>
                <Plus className="text-ink-3 size-icon flex-none transition-transform group-open:rotate-45" />
              </summary>
              <p className="text-ink-2 m-0 max-w-[62ch] pb-5 leading-relaxed">
                {t(`about.faq.${question}.a`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
