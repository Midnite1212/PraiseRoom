import { ArrowRight } from 'pixelarticons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tag } from '@/components/primitives/tag';
import { useIsRoomy, useIsWide } from '@/hooks/use-wide';

import { ChordedHeading } from './chorded-heading';
import { DeviceFrame, DeviceSwitcher } from './device-frame';
import type { DeviceForm, PreviewScreen } from './screens';
import { EYEBROW_CLASSES, SectionHead } from './section-head';

const FEATURES = [
  { id: 'library', screen: 'library', form: 'desktop', chords: ['G', 'C', 'D'], musicKey: 'G' },
  { id: 'charts', screen: 'chart', form: 'tablet', chords: ['Em', 'C', 'G'], musicKey: 'G' },
  {
    id: 'transpose',
    screen: 'transpose',
    form: 'phone',
    chords: ['Bb', 'F/A', 'Eb'],
    musicKey: 'Bb',
  },
  { id: 'setlists', screen: 'setlists', form: 'desktop', chords: ['D', 'G', 'C'], musicKey: 'G' },
  { id: 'musician', screen: 'musician', form: 'tv', chords: ['C', 'D', 'Em'], musicKey: 'G' },
  { id: 'sharing', screen: 'sharing', form: 'phone', chords: ['G', 'D', 'Am', 'C'], musicKey: 'G' },
  { id: 'bilingual', screen: 'bilingual', form: 'desktop', chords: ['G', 'C', 'G'], musicKey: 'G' },
] as const satisfies readonly {
  id: string;
  screen: PreviewScreen;
  form: DeviceForm;
  chords: readonly string[];
  musicKey: string;
}[];

type FeatureId = (typeof FEATURES)[number]['id'];

const useActiveFeature = (list: HTMLElement | null, isRoomy: boolean): number => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!list || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index =
            entry.target instanceof HTMLElement ? Number(entry.target.dataset.feature) : NaN;
          if (entry.isIntersecting && Number.isInteger(index)) setActive(index);
        }
      },
      { rootMargin: isRoomy ? '-45% 0px -54% 0px' : '-22% 0px -77% 0px' }
    );
    for (const feature of list.querySelectorAll('[data-feature]')) observer.observe(feature);
    return () => observer.disconnect();
  }, [list, isRoomy]);
  return active;
};

export function FeaturesSection() {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const isRoomy = useIsRoomy();
  const [list, setList] = useState<HTMLElement | null>(null);
  const [picked, setPicked] = useState<Partial<Record<FeatureId, DeviceForm>>>({});
  const activeIndex = useActiveFeature(list, isRoomy);
  const active = FEATURES[activeIndex] ?? FEATURES[0];
  const form = picked[active.id] ?? (isWide ? active.form : 'phone');

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="wide:px-10 mx-auto max-w-[1320px] scroll-mt-16 px-(--pg) pt-24"
    >
      <SectionHead
        id="features-title"
        eyebrow={t('about.features.eyebrow')}
        title={t('about.features.title')}
        chords={['G', 'Em', 'C', 'D']}
        lede={t('about.features.lede')}
      />
      <div className="roomy:grid roomy:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] roomy:gap-12">
        <div ref={setList} className="roomy:col-start-1 roomy:pb-[24svh]">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.id}
              data-feature={index}
              aria-labelledby={`feature-${feature.id}`}
              className="border-hairline roomy:min-h-[82svh] roomy:content-center grid min-h-[66svh] content-start gap-4 border-t py-10"
            >
              <p className={EYEBROW_CLASSES}>
                <span className="text-ink-3 mr-2">{String(index + 1).padStart(2, '0')}</span>
                {t(`about.features.${feature.id}.kicker`)}
              </p>
              <ChordedHeading
                as="h3"
                id={`feature-${feature.id}`}
                text={t(`about.features.${feature.id}.title`)}
                chords={feature.chords}
                musicKey={feature.musicKey}
                className="text-subhead m-0 font-bold tracking-[-0.03em]"
              />
              <p className="text-ink-2 m-0 max-w-[52ch] leading-relaxed">
                {t(`about.features.${feature.id}.lede`)}
              </p>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {Object.values(
                  t(`about.features.${feature.id}.facts`, { returnObjects: true })
                ).map((fact) => (
                  <li key={fact}>
                    <Tag className="h-7 px-3 text-[0.8125rem]">{fact}</Tag>
                  </li>
                ))}
              </ul>
              <p className="text-ink m-0 flex items-start gap-2 text-sm font-semibold">
                <ArrowRight className="text-brand size-icon mt-0.5 flex-none" />
                {t(`about.features.${feature.id}.try`)}
              </p>
            </article>
          ))}
        </div>

        <div className="roomy:col-start-2 roomy:row-start-1 roomy:top-[76px] roomy:bottom-auto roomy:mx-0 roomy:h-[calc(100svh-96px)] roomy:self-start roomy:bg-transparent roomy:pt-0 roomy:before:hidden before:from-ground bg-ground sticky bottom-0 z-10 -mx-(--pg) h-[52svh] px-(--pg) pt-3 pb-[max(12px,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-10 before:h-10 before:bg-linear-to-t before:to-transparent">
          <div className="grid h-full grid-rows-[minmax(0,1fr)_auto_auto] justify-items-center gap-3">
            <DeviceFrame
              form={form}
              screen={active.screen}
              label={t('about.preview.frameTitle', {
                name: t(`about.features.${active.id}.kicker`),
                screen: t(`about.features.screens.${form}`),
              })}
            />
            <DeviceSwitcher
              value={form}
              onChange={(next) => setPicked((current) => ({ ...current, [active.id]: next }))}
            />
            <p className="text-ink-3 m-0 min-h-[1.25em] text-center font-mono text-xs">
              {t(`about.features.${active.id}.screen`)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
