import { Link } from '@tanstack/react-router';
import { ColorsSwatch } from 'pixelarticons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AccentChoice, LanguageChoice, ThemeChoice } from '@/components/layout/preference-choices';
import { ActionMenu } from '@/components/primitives/action-menu';
import { BrandMark } from '@/components/primitives/brand-mark';
import { Button } from '@/components/ui/button';

export const ABOUT_SECTIONS = ['features', 'demo', 'guides', 'feedback', 'give', 'faq'] as const;

function PreferenceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 pl-3">
      <span className="font-semibold">{label}</span>
      {children}
    </div>
  );
}

function DisplayMenu() {
  const { t } = useTranslation();
  return (
    <ActionMenu
      align="end"
      title={t('about.prefs.title')}
      trigger={
        <Button variant="ghost" size="icon" aria-label={t('about.prefs.button')}>
          <ColorsSwatch />
        </Button>
      }
    >
      <PreferenceRow label={t('theme.label')}>
        <ThemeChoice compact />
      </PreferenceRow>
      <PreferenceRow label={t('settings.accent.title')}>
        <AccentChoice showName={false} />
      </PreferenceRow>
    </ActionMenu>
  );
}

export function AboutHeader() {
  const { t } = useTranslation();
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-[max(10px,env(safe-area-inset-left))] pt-(--top)">
      <div className="glass glass-over pointer-events-auto mx-auto flex h-14 max-w-[1320px] items-center gap-2 pr-2 pl-4">
        <Link
          to="/"
          className="flex flex-none items-center gap-2.5 font-bold tracking-[-0.01em] whitespace-nowrap"
        >
          <BrandMark />
          {t('app.name')}
        </Link>
        <nav aria-label={t('about.nav.label')} className="roomy:flex mx-auto hidden gap-0.5">
          {ABOUT_SECTIONS.map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className="text-ink-2 hover:text-ink hover:liquid-hover rounded-full px-3 py-2 text-sm font-semibold transition-colors"
            >
              {t(`about.nav.${section}`)}
            </a>
          ))}
        </nav>
        <div className="roomy:ml-0 ml-auto flex items-center gap-1">
          <LanguageChoice compact />
          <DisplayMenu />
          <Button asChild className="wide:inline-flex hidden">
            <a href="#demo">{t('about.nav.tryIt')}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
