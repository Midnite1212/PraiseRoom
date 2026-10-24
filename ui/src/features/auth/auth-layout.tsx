import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageChoice, ThemeChoice } from '@/components/layout/preference-choices';
import { BrandMark } from '@/components/primitives/brand-mark';
import { cn } from '@/lib/utils';

const ART_PIXELS = [
  { id: 'first', lit: true },
  { id: 'second', lit: true },
  { id: 'third', lit: false },
  { id: 'fourth', lit: false },
] as const;

function Brand({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center gap-2.5 font-bold', className)}>
      <BrandMark />
      {t('app.name')}
    </div>
  );
}

// The signed-out frame: no rail or tab bar. Wide screens put the product beside the glass card, a
// chord line over a lit pixel strip; phones show the brand above the card.
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="relative">
      <div aria-hidden className="ground-wash pointer-events-none fixed inset-0" />
      <div className="wide:max-w-[1180px] wide:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] wide:content-center wide:items-center wide:gap-16 wide:p-12 relative mx-auto grid min-h-dvh content-start justify-items-center px-(--pg) pt-[calc(var(--top)+16px)] pb-8">
        <section
          aria-hidden
          className="wide:col-start-1 wide:row-span-2 wide:row-start-1 wide:flex wide:flex-col wide:justify-between wide:self-stretch hidden py-1 pb-2"
        >
          <Brand />
          <div>
            <p className="text-ink-3 mb-3 font-mono text-xs font-bold tracking-[0.12em] uppercase">
              {t('auth.art.label')}
            </p>
            <p className="mb-1.5 flex flex-wrap text-5xl leading-[1.2] font-semibold tracking-[-0.02em]">
              <ArtWord chord="E">Sing to the </ArtWord>
              <ArtWord chord="A">Lord</ArtWord>
            </p>
            <p className="mb-1.5 flex flex-wrap text-5xl leading-[1.2] font-semibold tracking-[-0.02em]">
              <ArtWord
                chord={
                  <>
                    B<sup className="text-[0.7em] leading-[0]">7</sup>
                  </>
                }
              >
                a new{' '}
              </ArtWord>
              <ArtWord chord="C#m">song</ArtWord>
            </p>
            <span className="mt-7 flex gap-1">
              {ART_PIXELS.map(({ id, lit }) => (
                <i
                  key={id}
                  className={cn(
                    'bg-pixel-off h-1.5 w-[22px]',
                    lit && 'bg-pixel-on shadow-[0_1px_8px_var(--pixel-glow)]'
                  )}
                />
              ))}
            </span>
          </div>
          <p className="text-ink-2 max-w-[30ch] text-lg leading-normal">{t('auth.art.tagline')}</p>
        </section>
        <main className="wide:col-start-2 wide:row-start-1 glass wide:px-9 wide:pt-9 wide:pb-[30px] w-full max-w-[440px] px-6 py-7 [--glass-r:32px]">
          <Brand className="wide:hidden mb-6 justify-center" />
          {children}
        </main>
        <div className="wide:col-start-2 wide:row-start-2 relative mt-6 flex flex-wrap justify-center gap-2">
          <LanguageChoice />
          <ThemeChoice />
        </div>
      </div>
    </div>
  );
}

function ArtWord({ chord, children }: { chord: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex flex-col whitespace-pre">
      <span className="text-chord font-mono text-[0.45em] leading-[1.4] font-semibold tracking-normal">
        {chord}
      </span>
      {children}
    </span>
  );
}

export const AUTH_TITLE_CLASSES =
  'm-0 text-page-title leading-[1.08] font-bold tracking-[-0.03em] text-balance';
export const AUTH_SUB_CLASSES = 'text-ink-2 mt-2.5 mb-6 leading-normal [&_b]:text-ink';
export const AUTH_FINE_CLASSES = 'text-ink-3 mt-4 text-center text-[0.8125rem] leading-normal';
export const AUTH_SWITCH_CLASSES = 'text-ink-2 mt-[22px] text-center text-sm';
