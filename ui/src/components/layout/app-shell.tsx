import { Link, useMatches, useRouterState } from '@tanstack/react-router';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toInitials } from '@/components/primitives/avatar';
import { BrandMark } from '@/components/primitives/brand-mark';
import { Vinyl } from '@/components/primitives/vinyl';
import type { Session } from '@/features/auth/session';
import { useScrolledClass } from '@/hooks/use-scrolled-class';
import { useIsRoomy, useIsWide } from '@/hooks/use-wide';
import { isRailShortcut, railShortcutLabel, toggledRail, useRail } from '@/lib/rail';

import { AppBarSlotsContext } from './app-bar-slots';
import { NAV_ITEMS, useNavCounts } from './nav';
import { NextUpIsland } from './next-up-island';
import { ProfileMenu } from './profile-menu';
import { SidebarIcon } from './sidebar-icon';

// Wide: the brand on the ground, then floating islands down the left (pages, next up, you). Phones: a top bar with the brand and
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
  const counts = useNavCounts(session);
  const [left, setLeft] = useState<HTMLElement | null>(null);
  const [right, setRight] = useState<HTMLElement | null>(null);
  const initial = toInitials(session.fullName);
  const [chosenRail, setRail] = useRail();
  const isWide = useIsWide();
  const isNarrow = !useIsRoomy();
  const rail = isNarrow ? 'folded' : chosenRail;
  const folded = rail === 'folded';
  const toggleLabel = t(folded ? 'nav.expandSidebar' : 'nav.collapseSidebar');
  const shortcut = railShortcutLabel(navigator.platform);

  useEffect(() => {
    if (!isWide || isNarrow) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isRailShortcut(event)) return;
      event.preventDefault();
      setRail(toggledRail(rail));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isWide, isNarrow, rail, setRail]);

  return (
    <AppBarSlotsContext value={{ left, right }}>
      <div data-rail={rail} className="group/rail data-[rail=folded]:[--rail-w:72px]">
        <div aria-hidden className="ground-wash pointer-events-none fixed inset-0 z-0" />
        <div
          aria-hidden
          className="edge-top wide:h-20 compact:in-[:root:has([data-slide-over])]:hidden pointer-events-none fixed inset-x-0 top-0 z-20 h-[calc(var(--top)+64px)] opacity-0 transition-opacity duration-200 ease-out in-[.scrolled]:opacity-100 in-[:root:has([data-finder])]:hidden"
        />
        <div
          aria-hidden
          className="edge-bottom wide:hidden pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[calc(var(--bottom)+var(--tab-h)+40px)] in-[.editing]:hidden"
        />

        <aside
          aria-label={t('app.name')}
          className="wide:flex ease-liquid pointer-events-none fixed top-(--top) bottom-(--bottom) left-(--frame-l) z-30 hidden w-(--rail-w) flex-col gap-2.5 transition-[width] duration-[360ms] *:pointer-events-auto"
        >
          <div className="group/brand relative flex h-(--head-h) flex-none items-center self-stretch pr-2.5 pl-5 group-data-[rail=folded]/rail:justify-center group-data-[rail=folded]/rail:p-0">
            <Link
              to="/"
              aria-label={t('app.name')}
              className="flex items-center gap-3 font-bold tracking-[-0.01em] whitespace-nowrap"
            >
              <BrandMark className="-ml-2.5 transition-opacity duration-150 ease-out group-data-[rail=folded]/rail:ml-[-6px] group-data-[rail=folded]/rail:group-focus-within/brand:opacity-0 group-data-[rail=folded]/rail:group-hover/brand:opacity-0" />
              <span className="group-data-[rail=folded]/rail:hidden">{t('app.name')}</span>
            </Link>
            {isNarrow ? null : (
              <button
                type="button"
                aria-label={toggleLabel}
                aria-expanded={!folded}
                title={`${toggleLabel} (${shortcut})`}
                onClick={() => setRail(toggledRail(rail))}
                className="text-ink-3 hover:text-ink focus-visible:ring-ring [&_svg]:size-icon ml-auto grid size-9 flex-none place-items-center rounded-full transition-[color,opacity] duration-150 ease-out outline-none group-data-[rail=folded]/rail:absolute group-data-[rail=folded]/rail:inset-0 group-data-[rail=folded]/rail:m-auto group-data-[rail=folded]/rail:opacity-0 group-data-[rail=folded]/rail:group-hover/brand:opacity-100 focus-visible:opacity-100 focus-visible:ring-2"
              >
                <SidebarIcon />
              </button>
            )}
          </div>

          <nav
            aria-label={t('nav.pages')}
            className="glass flex flex-col gap-0.5 p-2 [--glass-r:24px]"
          >
            {NAV_ITEMS.map(({ id, to, labelKey, icon: Icon }) => (
              <Link
                key={id}
                to={to}
                activeOptions={{ exact: to === '/' }}
                aria-label={t(labelKey)}
                title={folded ? t(labelKey) : undefined}
                className="lit-icon text-ink-2 hover:liquid-hover hover:text-ink data-[status=active]:liquid-on data-[status=active]:text-ink data-[status=active]:hover:liquid-on [&_svg]:size-icon text-ui flex h-11 items-center gap-3 rounded-2xl px-3 font-semibold transition-colors group-data-[rail=folded]/rail:justify-center group-data-[rail=folded]/rail:gap-0 group-data-[rail=folded]/rail:p-0 [&_svg]:flex-none"
              >
                <Icon />
                <span className="group-data-[rail=folded]/rail:hidden">{t(labelKey)}</span>
                <span className="text-ink-3 ml-auto font-mono text-xs font-semibold group-data-[rail=folded]/rail:hidden">
                  {counts[id]}
                </span>
              </Link>
            ))}
          </nav>

          <NextUpIsland pathname={pathname} />

          <ProfileMenu
            session={session}
            trigger={
              <button
                type="button"
                aria-label={folded ? session.fullName : undefined}
                title={folded ? session.fullName : undefined}
                className="glass group/vinyl mt-auto flex items-center gap-3 py-1.5 pr-4 pl-1.5 text-left group-data-[rail=folded]/rail:justify-center group-data-[rail=folded]/rail:p-1.5"
              >
                <Vinyl initial={initial} />
                <span className="min-w-0 group-data-[rail=folded]/rail:hidden">
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

        <main className="wide:mr-0 wide:ml-[calc(var(--frame-l)+var(--rail-w))] wide:transition-[margin-left] wide:duration-[360ms] wide:ease-liquid wide:max-w-none wide:px-12 wide:pt-(--top) wide:pb-16 relative z-[1] mx-auto max-w-[760px] px-(--pg) pt-[calc(var(--top)+60px)] pb-[calc(var(--tab-h)+var(--bottom)+96px)]">
          <div key={pathname} className="animate-view-in wide:max-w-[calc(1272px-var(--rail-w))]">
            {children}
          </div>
        </main>

        <nav
          aria-label={t('nav.pages')}
          className="wide:hidden pointer-events-none fixed right-[max(10px,env(safe-area-inset-right))] bottom-(--bottom) left-[max(10px,env(safe-area-inset-left))] z-30 mx-auto flex max-w-[560px] gap-2 in-[.editing]:hidden"
        >
          <div className="glass glass-over pointer-events-auto grid h-(--tab-h) flex-1 grid-cols-4 gap-0.5 p-1.5">
            {NAV_ITEMS.map(({ id, to, labelKey, icon: Icon }) => (
              <Link
                key={id}
                to={to}
                activeOptions={{ exact: to === '/' }}
                className="lit-icon text-ink-2 data-[status=active]:liquid-on data-[status=active]:text-ink [&_svg]:size-icon flex flex-col items-center justify-center gap-[3px] rounded-full text-[0.6875rem] font-semibold transition-colors"
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
