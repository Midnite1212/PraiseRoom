import { ChevronDown, Sparkle } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { MarkedText } from './marked-text';
import { SectionHead } from './section-head';

const GUIDES = [
  { room: 'library', guide: 'library.findSong', tip: 'library.findSong' },
  { room: 'library', guide: 'library.addSong', tip: null },
  { room: 'charts', guide: 'charts.notation', tip: 'charts.notation' },
  { room: 'charts', guide: 'charts.colours', tip: null },
  { room: 'transpose', guide: 'transpose.whileReading', tip: 'transpose.whileReading' },
  { room: 'transpose', guide: 'transpose.forTeam', tip: null },
  { room: 'setlists', guide: 'setlists.create', tip: null },
  { room: 'musician', guide: 'musician.play', tip: 'musician.play' },
  { room: 'sharing', guide: 'sharing.team', tip: null },
  { room: 'sharing', guide: 'sharing.public', tip: 'sharing.public' },
] as const;

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
      <div className="wide:grid-cols-2 roomy:grid-cols-3 grid items-start gap-3">
        {GUIDES.map(({ room, guide, tip }) => (
          <details
            key={guide}
            className="group bg-fill-hover open:bg-fill-press rounded-3xl transition-colors"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1">
                <span className="text-ink-3 block font-mono text-[0.6875rem] font-semibold tracking-[0.12em] uppercase">
                  {t(`about.features.${room}.kicker`)}
                </span>
                <span className="mt-0.5 block font-semibold">
                  {t(`about.guides.${guide}.title`)}
                </span>
              </span>
              <ChevronDown className="text-ink-3 size-icon flex-none transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5">
              <ol className="text-ink-2 m-0 grid gap-2 pl-5 text-sm leading-relaxed marker:font-mono marker:text-xs">
                {Object.values(t(`about.guides.${guide}.steps`, { returnObjects: true })).map(
                  (step) => (
                    <li key={step}>
                      <MarkedText text={step} />
                    </li>
                  )
                )}
              </ol>
              {tip ? (
                <p className="bg-fill-on text-ink m-0 mt-4 flex gap-2 rounded-2xl px-3 py-2.5 text-[0.8125rem]">
                  <Sparkle className="text-brand size-icon mt-0.5 flex-none" />
                  <span>
                    <span className="sr-only">{t('about.guides.tipLabel')}: </span>
                    {t(`about.guides.${tip}.tip`)}
                  </span>
                </p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
