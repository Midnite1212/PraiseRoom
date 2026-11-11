import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsWide } from '@/hooks/use-wide';

import { DeviceFrame, DeviceSwitcher } from './device-frame';
import type { DeviceForm } from './screens';
import { SectionHead } from './section-head';

const STEPS = ['key', 'numbers', 'songs', 'lyrics'] as const;

export function DemoSection() {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const [picked, setPicked] = useState<DeviceForm | null>(null);
  const form = picked ?? (isWide ? 'desktop' : 'phone');

  return (
    <section
      id="demo"
      aria-labelledby="demo-title"
      className="wide:px-10 mx-auto max-w-[1320px] scroll-mt-16 px-(--pg) pt-28"
    >
      <div className="roomy:grid roomy:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] roomy:items-center roomy:gap-12">
        <div>
          <SectionHead
            id="demo-title"
            eyebrow={t('about.demo.eyebrow')}
            title={t('about.demo.title')}
            chords={['G', 'D', 'G']}
            lede={t('about.demo.lede')}
            className="mb-6"
          />
          <ol className="m-0 mb-8 grid list-none gap-2 p-0">
            {STEPS.map((step, index) => (
              <li key={step} className="bg-fill-hover flex gap-3 rounded-2xl px-4 py-3 text-sm">
                <span className="text-brand font-mono font-bold">{index + 1}</span>
                <span className="text-ink-2">{t(`about.demo.steps.${step}`)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid justify-items-center gap-3">
          <div className="h-[min(78svh,720px)] w-full">
            <DeviceFrame
              form={form}
              screen="demo"
              label={t('about.preview.frameTitle', {
                name: t('about.demo.frame'),
                screen: t(`about.features.screens.${form}`),
              })}
            />
          </div>
          <DeviceSwitcher value={form} onChange={setPicked} />
        </div>
      </div>
    </section>
  );
}
