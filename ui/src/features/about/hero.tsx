import { ArrowDown, ArrowRight, Play, Users } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ChordedHeading } from './chorded-heading';
import { DeviceFrame } from './device-frame';
import { plainText } from './marked-text';
import { EYEBROW_CLASSES } from './section-head';

const SCRAP_CLASSES =
  'about-scrap absolute top-1/2 left-1/2 text-xs leading-snug shadow-[0_18px_40px_-14px_var(--shadow)]';

const WAVE_BARS = [
  'h-1.5',
  'h-3',
  'h-4',
  'h-2',
  'h-3.5',
  'h-5',
  'h-2.5',
  'h-4',
  'h-1.5',
  'h-3',
  'h-2',
  'h-3.5',
  'h-1.5',
] as const;

function Pile() {
  const { t } = useTranslation();
  return (
    <div aria-hidden className="about-pile pointer-events-none absolute inset-0 z-[3]">
      <div
        className={cn(
          SCRAP_CLASSES,
          'bg-paper text-paper-ink w-[clamp(150px,34cqw,236px)] overflow-hidden rounded-[3px] p-3.5 [--i:0] [--r:-9deg] [--sx:-6px] [--sy:-21cqh] [--x:-30cqw] [--y:-28cqh]'
        )}
      >
        <div className="border-paper-ink/25 mb-2 flex items-baseline justify-between gap-2 border-b pb-1.5">
          <span className="font-lyrics text-[0.95rem] font-semibold italic">Amazing Grace</span>
          <span className="text-pen font-semibold">{t('about.hero.pile.penKey')}</span>
        </div>
        <pre className="m-0 font-mono text-[0.6875rem] leading-snug whitespace-pre">
          {
            'G        G7      C     G\nAmazing grace how sweet the sound\nG           Em     D\nThat saved a wretch like me'
          }
        </pre>
        <span className="text-paper-ink/60 mt-2 block text-right font-mono text-[0.625rem]">
          {t('about.hero.pile.copy')}
        </span>
      </div>

      <div
        className={cn(
          SCRAP_CLASSES,
          'bg-bubble text-bubble-ink w-[clamp(150px,30cqw,214px)] rounded-2xl p-2.5 [--i:1] [--r:7deg] [--sx:6px] [--sy:-15cqh] [--x:28cqw] [--y:-30cqh]'
        )}
      >
        <div className="mb-2 flex items-center gap-1.5 font-semibold">
          <Users className="size-3.5" />
          {t('about.hero.pile.chat')}
        </div>
        <div className="bg-bubble-mine flex items-center gap-2 rounded-xl p-2">
          <span className="bg-pen text-paper rounded px-1.5 py-1 font-mono text-[0.625rem] font-bold">
            PDF
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{t('about.hero.pile.pdfName')}</span>
            <span className="block opacity-70">{t('about.hero.pile.pdfMeta')}</span>
          </span>
        </div>
      </div>

      <div
        className={cn(
          SCRAP_CLASSES,
          'bg-shot text-shot-ink w-[clamp(150px,32cqw,224px)] overflow-hidden rounded-md [--i:2] [--r:5deg] [--sx:-6px] [--sy:-9cqh] [--x:-31cqw] [--y:8cqh]'
        )}
      >
        <div className="bg-shot-bar flex items-center gap-1 px-2 py-1.5">
          <i className="bg-shot-ink/30 size-1.5 rounded-full" />
          <i className="bg-shot-ink/30 size-1.5 rounded-full" />
          <i className="bg-shot-ink/30 size-1.5 rounded-full" />
          <span className="bg-shot ml-1 truncate rounded px-1.5 font-mono text-[0.625rem]">
            {t('about.hero.pile.site')}
          </span>
        </div>
        <div className="bg-shot-ad m-2 grid h-8 place-items-center rounded text-[0.625rem] font-bold">
          {t('about.hero.pile.ad')}
        </div>
        <div className="px-2.5 pb-2.5 font-mono text-[0.6875rem]">
          <span className="block opacity-70">{t('about.hero.pile.capo')}</span>
          <span className="text-pen block font-bold">D Bm G</span>
          <span className="block">Holy, holy, holy</span>
          <i className="bg-shot-bar mt-1.5 block h-1 w-11/12 rounded-full" />
          <i className="bg-shot-bar mt-1 block h-1 w-2/3 rounded-full" />
        </div>
      </div>

      <div
        className={cn(
          SCRAP_CLASSES,
          'bg-bubble text-bubble-ink grid w-[clamp(140px,28cqw,200px)] gap-1.5 rounded-2xl p-2.5 [--i:3] [--r:-6deg] [--sx:6px] [--sy:-3cqh] [--x:30cqw] [--y:5cqh]'
        )}
      >
        <p className="m-0">
          {t('about.hero.pile.chatMessage')}
          <span className="mt-1 block opacity-80">
            1. Holy, Holy, Holy
            <br />
            2. Amazing Grace
            <br />
            3. It Is Well
          </span>
        </p>
        <p className="bg-bubble-mine m-0 justify-self-end rounded-xl px-2 py-1">
          {t('about.hero.pile.chatReply')}
        </p>
      </div>

      <div
        className={cn(
          SCRAP_CLASSES,
          'bg-sticky text-sticky-ink w-[clamp(110px,22cqw,150px)] rounded-[2px] p-3 text-lg leading-tight font-bold [--i:4] [--r:-4deg] [--sx:-6px] [--sy:3cqh] [--x:-6cqw] [--y:-6cqh]'
        )}
      >
        {t('about.hero.pile.sticky')}
      </div>

      <div
        className={cn(
          SCRAP_CLASSES,
          'bg-memo text-memo-ink border-bezel w-[clamp(130px,26cqw,186px)] rounded-[18px] border-4 p-3 [--i:5] [--r:10deg] [--sx:6px] [--sy:9cqh] [--x:12cqw] [--y:30cqh]'
        )}
      >
        <p className="text-memo-head m-0 mb-1 font-semibold">{t('about.hero.pile.notes')}</p>
        <p className="m-0 font-mono text-[0.6875rem]">
          It Is Well
          <br />
          Bb Eb Bb
          <br />
          When peace like a river
        </p>
      </div>

      <div
        className={cn(
          SCRAP_CLASSES,
          'bg-bubble-mine text-bubble-ink flex w-[clamp(140px,28cqw,204px)] items-center gap-2.5 rounded-[16px_16px_16px_4px] px-3 py-2 [--i:6] [--r:4deg] [--sx:-6px] [--sy:15cqh] [--x:-20cqw] [--y:33cqh]'
        )}
      >
        <span className="bg-voice text-paper grid size-7 flex-none place-items-center rounded-full">
          <Play className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex h-5 items-center gap-0.5">
            {WAVE_BARS.map((height, index) => (
              <i
                key={`${height}-${String(index)}`}
                className={cn('bg-bubble-ink/60 w-[3px] rounded-full', height)}
              />
            ))}
          </span>
          <span className="block opacity-70">{t('about.hero.pile.voice')}</span>
        </span>
      </div>
    </div>
  );
}

export function AboutHero() {
  const { t } = useTranslation();
  const before = t('about.hero.before');
  const after = t('about.hero.after');
  const headline = 'text-display m-0 font-bold tracking-[-0.035em] col-start-1 row-start-1';

  return (
    <section aria-labelledby="about-hero-title" className="about-hero relative">
      <div className="about-hero-pin overflow-clip">
        <div className="roomy:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] roomy:grid-rows-1 roomy:items-center wide:px-10 mx-auto grid h-full min-h-svh max-w-[1320px] grid-rows-[auto_minmax(0,1fr)] gap-6 px-(--pg) pt-[84px] pb-6">
          <div className="roomy:gap-6 relative z-[4] grid content-start gap-4">
            <p className={EYEBROW_CLASSES}>{t('about.hero.eyebrow')}</p>
            <h1 id="about-hero-title" className="sr-only">
              {`${plainText(before)} ${plainText(after)}`}
            </h1>
            <div aria-hidden className="grid">
              <ChordedHeading
                as="p"
                motion="load"
                text={before}
                chords={['G', 'D/F#', 'Em', 'C']}
                musicKey="G"
                className={cn(
                  'about-before about-step [--from:22%] [--step:about-out] [--to:42%]',
                  headline
                )}
              />
              <ChordedHeading
                as="p"
                motion="load"
                text={after}
                chords={['C', 'G', 'D', 'G']}
                musicKey="G"
                className={cn('about-step [--from:38%] [--step:about-in] [--to:58%]', headline)}
              />
            </div>
            <p className="text-ink-2 roomy:text-[1.0625rem] m-0 max-w-[46ch] leading-relaxed">
              {t('about.hero.lede')}
            </p>
            <span className="about-hint about-step text-ink-3 items-center gap-2 font-mono text-xs [--from:0%] [--step:about-out] [--to:8%]">
              <ArrowDown className="size-icon" />
              {t('about.hero.scrollHint')}
            </span>
            <div className="about-step flex flex-wrap gap-2.5 [--from:78%] [--step:about-in] [--to:93%]">
              <Button asChild>
                <a href="#demo">
                  {t('about.hero.openDemo')}
                  <ArrowRight />
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a href="#features">{t('about.hero.seeInside')}</a>
              </Button>
            </div>
          </div>

          <div className="roomy:h-[min(78svh,720px)] [container-type:size] relative min-h-[300px]">
            <Pile />
            <div className="about-step absolute top-[2%] left-0 z-0 h-[42%] w-[54%] [--from:72%] [--step:about-rise] [--to:90%]">
              <DeviceFrame
                decorative
                form="tv"
                screen="musician"
                label={t('about.features.musician.kicker')}
              />
            </div>
            <div className="about-step absolute inset-x-[3%] top-[16%] z-[1] h-[64%] [--from:16%] [--step:about-in] [--to:36%]">
              <DeviceFrame
                decorative
                form="desktop"
                screen="setlists"
                label={t('about.features.setlists.kicker')}
              />
            </div>
            <div className="about-step absolute right-0 bottom-[5%] z-[2] h-[60%] w-[30%] [--from:72%] [--step:about-rise] [--to:90%]">
              <DeviceFrame
                decorative
                form="phone"
                screen="chart"
                label={t('about.features.charts.kicker')}
              />
            </div>
            <p className="about-step text-ink-3 absolute inset-x-0 bottom-0 z-[3] m-0 text-center font-mono text-xs [--from:86%] [--step:about-in] [--to:98%]">
              {t('about.hero.devicesCaption')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
