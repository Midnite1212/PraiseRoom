import { Link, useMatches, useRouterState } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toInitials } from '@/components/primitives/avatar';
import { BrandMark } from '@/components/primitives/brand-mark';
import { Vinyl } from '@/components/primitives/vinyl';
import { Button } from '@/components/ui/button';
import type { Session } from '@/features/auth/session';
import { useScrolledClass } from '@/hooks/use-scrolled-class';
import { createStoredChoice } from '@/lib/stored-choice';

import { AppBarSlotsContext } from './app-bar-slots';
import { NAV_ITEMS, useNavCounts } from './nav';
import { ProfileMenu } from './profile-menu';

// A hook-named alias, so the React Compiler calls it on every render instead of memoizing it.
const useRail = createStoredChoice('rail', ['open', 'min'], 'open').use;

// Wide: three floating islands down the left (brand, pages, you). Phones: a top bar with the brand and
// your profile, and one glass tab island at the bottom. Reader routes bring their own chrome.
export function AppShell({ session, children }: { session: Session; children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isReader = useMatches({
    select: (matches) => matches.some((match) => match.staticData.chrome === 'reader'),
  });
  useScrolledClass();

  if (isReader) return children;
  return (
    <PageChrome session={session} pathname={pathname}>
      {children}
    </PageChrome>
  );
}

function PageChrome({
  session,
  pathname,
  children,
}: {
  session: Session;
  pathname: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [rail, setRail] = useRail();
  const counts = useNavCounts(session);
  const [left, setLeft] = useState<HTMLElement | null>(null);
  const [right, setRight] = useState<HTMLElement | null>(null);
  const isMin = rail === 'min';
  const initial = toInitials(session.fullName);
  const railLabel = isMin ? t('nav.expandSidebar') : t('nav.collapseSidebar');

  return (
    <AppBarSlotsContext value={{ left, right }}>
      <div data-rail={rail} className="group/shell data-[rail=min]:[--rail-w:64px]">
        <div aria-hidden className="ground-wash pointer-events-none fixed inset-0 z-0" />
        <div
          aria-hidden
          className="edge-top wide:h-20 pointer-events-none fixed inset-x-0 top-0 z-20 h-[calc(var(--top)+64px)] opacity-0 transition-opacity duration-200 ease-out in-[.scrolled]:opacity-100 in-[:root:has([data-finder])]:hidden"
        />
        <div
          aria-hidden
          className="edge-bottom wide:hidden pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[calc(var(--bottom)+var(--tab-h)+40px)]"
        />

        <aside
          aria-label={t('app.name')}
          className="wide:flex pointer-events-none fixed top-(--top) bottom-(--bottom) left-(--frame-l) z-30 hidden w-(--rail-w) flex-col gap-2.5 transition-[width] duration-300 ease-out *:pointer-events-auto"
        >
          <div className="flex h-12 items-center justify-between gap-2 group-data-[rail=min]/shell:h-auto group-data-[rail=min]/shell:flex-col group-data-[rail=min]/shell:pt-3.5">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2.5 pl-3.5 font-bold tracking-[-0.01em] whitespace-nowrap group-data-[rail=min]/shell:pl-0"
            >
              <BrandMark />
              <span className="group-data-[rail=min]/shell:hidden">{t('app.name')}</span>
            </Link>
            <Button
              variant="glass"
              size="icon"
              aria-pressed={isMin}
              aria-label={railLabel}
              title={railLabel}
              className="text-ink-2 hover:text-ink aria-pressed:bg-transparent"
              onClick={() => setRail(isMin ? 'open' : 'min')}
            >
              {isMin ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>

          <nav
            aria-label={t('nav.pages')}
            className="glass flex flex-col gap-0.5 p-2 [--glass-r:24px] group-data-[rail=min]/shell:p-1.5"
          >
            {NAV_ITEMS.map(({ id, to, labelKey, icon: Icon }) => (
              <Link
                key={id}
                to={to}
                title={t(labelKey)}
                activeOptions={{ exact: to === '/' }}
                className="text-ink-2 hover:bg-fill-hover hover:text-ink data-[status=active]:bg-fill-on data-[status=active]:text-ink [&_svg]:size-icon flex h-11 items-center gap-3 rounded-2xl px-3 font-semibold transition-colors group-data-[rail=min]/shell:justify-center group-data-[rail=min]/shell:px-0 [&_svg]:flex-none"
              >
                <Icon />
                <span className="group-data-[rail=min]/shell:hidden">{t(labelKey)}</span>
                <span className="text-ink-3 ml-auto font-mono text-xs font-semibold group-data-[rail=min]/shell:hidden">
                  {counts[id]}
                </span>
              </Link>
            ))}
          </nav>

          <ProfileMenu
            session={session}
            trigger={
              <button
                type="button"
                className="glass group/vinyl mt-auto flex items-center gap-3 py-1.5 pr-4 pl-1.5 text-left group-data-[rail=min]/shell:self-center group-data-[rail=min]/shell:p-1"
              >
                <Vinyl initial={initial} />
                <span className="min-w-0 group-data-[rail=min]/shell:hidden">
                  <b className="block truncate text-sm">{session.fullName}</b>
                  <small className="text-ink-3 block text-xs">
                    {t(`user.accessType.${session.accessType}`)} · {t('user.profile')}
                  </small>
                </span>
              </button>
            }
          />
        </aside>

        <header className="wide:hidden pointer-events-none fixed top-(--top) right-[max(10px,env(safe-area-inset-right))] left-[max(10px,env(safe-area-inset-left))] z-30 grid h-12 grid-cols-[1fr_auto_1fr] items-center gap-2 *:pointer-events-auto">
          <div ref={setLeft} className="flex" />
          <Link
            to="/"
            className="flex items-center gap-2 font-bold tracking-[-0.01em] whitespace-nowrap"
          >
            <BrandMark />
            {t('app.name')}
          </Link>
          <div className="flex justify-end gap-2">
            <div ref={setRight} className="contents" />
            <ProfileMenu
              session={session}
              trigger={
                <button
                  type="button"
                  aria-label={t('user.menu')}
                  title={t('user.menu')}
                  className="group/vinyl rounded-full"
                >
                  <Vinyl initial={initial} />
                </button>
              }
            />
          </div>
        </header>

        <main className="wide:mr-0 wide:ml-[calc(var(--frame-l)+var(--rail-w))] wide:max-w-none wide:px-12 wide:pt-7 wide:pb-16 relative z-[1] mx-auto max-w-[760px] px-(--pg) pt-[calc(var(--top)+60px)] pb-[calc(var(--tab-h)+var(--bottom)+96px)] transition-[margin] duration-300 ease-out">
          <div key={pathname} className="animate-view-in wide:max-w-[1040px]">
            {children}
          </div>
        </main>

        <nav
          aria-label={t('nav.pages')}
          className="wide:hidden pointer-events-none fixed right-[max(10px,env(safe-area-inset-right))] bottom-(--bottom) left-[max(10px,env(safe-area-inset-left))] z-30 mx-auto flex max-w-[560px] gap-2"
        >
          <div className="glass glass-over pointer-events-auto grid h-(--tab-h) flex-1 grid-cols-4 gap-0.5 p-1.5">
            {NAV_ITEMS.map(({ id, to, labelKey, icon: Icon }) => (
              <Link
                key={id}
                to={to}
                activeOptions={{ exact: to === '/' }}
                className="text-ink-2 data-[status=active]:bg-fill-on data-[status=active]:text-ink [&_svg]:size-icon flex flex-col items-center justify-center gap-[3px] rounded-full text-[0.6875rem] font-semibold transition-colors"
              >
                <Icon />
                {t(labelKey)}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </AppBarSlotsContext>
  );
}
