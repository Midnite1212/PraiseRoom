import type { ReactNode } from 'react';

import { useScrolledClass } from '@/hooks/use-scrolled-class';
import { cn } from '@/lib/utils';

import { useKeepAwake, useWakeLock } from './keep-awake';
import { useScrollingClass } from './use-scrolling-class';

type ReaderLayoutProps = {
  // Start of the top row: the back button.
  back?: ReactNode;
  // Wide screens: what is open (a setlist's name and date) beside the back button.
  title?: ReactNode;
  // Wide screens, setlists: One | Split, first in the right-hand group.
  layout?: ReactNode;
  // Lyrics | Chords, then (wide, chords on) the notation toggle.
  modes: ReactNode;
  // Auto-scroll's play button, after the modes.
  auto?: ReactNode;
  // The song's title, shown in the top row once its big title has scrolled away.
  compactTitle?: string;
  // End of the top row: Aa, edit, share…
  actions: ReactNode;
  // Wide screens: the setlist as a glass sidebar, or folded into a row under the top row.
  sidebar?: ReactNode;
  songbar?: ReactNode;
  // Phones: the set's progress under the top row, and the bottom dock.
  progress?: ReactNode;
  dock: ReactNode;
  // Wide screens, two songs side by side: `children` are the panes, each scrolling on its own under the top row.
  isSplit?: boolean;
  children: ReactNode;
};

// The full-screen reader: floating glass groups in a top row, the song on bare ground, and on phones a
// dock at the bottom. Nothing else from the app shell is on screen while reading.
export function ReaderLayout({
  back,
  title,
  layout,
  modes,
  auto,
  compactTitle,
  actions,
  sidebar,
  songbar,
  progress,
  dock,
  isSplit = false,
  children,
}: ReaderLayoutProps) {
  useScrolledClass();
  useScrollingClass();
  const [keepAwake] = useKeepAwake();
  useWakeLock(keepAwake === 'on');
  const offsetClass = sidebar
    ? 'wide:[--side-w:296px]'
    : songbar
      ? 'wide:[--bar-h:58px]'
      : undefined;

  return (
    <div className={cn('relative min-h-svh [--bar-h:0px] [--side-w:0px]', offsetClass)}>
      <div aria-hidden className="ground-wash pointer-events-none fixed inset-0 z-0" />
      <div
        aria-hidden
        className={cn(
          'edge-top pointer-events-none fixed inset-x-0 top-0 z-20 h-[calc(var(--top)+var(--top-h)+var(--bar-h)+22px)] opacity-0 transition-opacity duration-200 ease-out in-[.scrolled]:opacity-100',
          isSplit && 'hidden'
        )}
      />
      <div
        aria-hidden
        className="edge-bottom wide:hidden pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[calc(var(--bottom)+var(--dock-h)+28px)]"
      />

      <header className="wide:gap-2 pointer-events-none fixed top-(--top) right-(--frame-r) left-(--frame-l) z-30 flex h-(--top-h) items-center gap-1.5 *:pointer-events-auto">
        {back}
        {title ? (
          <div className="wide:flex pointer-events-none! hidden min-w-0 items-center gap-3 *:pointer-events-auto">
            {title}
          </div>
        ) : null}
        <div className="wide:order-2 wide:gap-2 flex items-center gap-1.5 *:pointer-events-auto">
          {layout}
          {modes}
          {auto}
        </div>
        <span className="wide:order-1 wide:text-left wide:px-1 pointer-events-none! min-w-0 flex-1 truncate px-0 text-center text-[0.9375rem] font-semibold opacity-0 transition-opacity duration-200 in-[.scrolled]:opacity-100">
          {compactTitle}
        </span>
        <div className="wide:order-3 wide:gap-2 flex items-center gap-1.5 *:pointer-events-auto">
          {actions}
        </div>
      </header>

      {sidebar ? (
        <aside className="glass wide:flex fixed top-[calc(var(--top)+var(--top-h)+10px)] bottom-(--bottom) left-(--frame-l) z-30 hidden w-[280px] flex-col px-2.5 pt-4 pb-2.5 [--glass-r:24px]">
          {sidebar}
        </aside>
      ) : null}
      {songbar ? (
        <div className="glass wide:flex fixed top-[calc(var(--top)+var(--top-h)+10px)] right-(--frame-r) left-(--frame-l) z-30 hidden h-12 items-center gap-1 px-1 [--glass-r:24px]">
          {songbar}
        </div>
      ) : null}
      {progress ? (
        <div className="wide:hidden fixed top-[calc(var(--top)+var(--top-h)+6px)] right-[calc(max(10px,env(safe-area-inset-right))+14px)] left-[calc(max(10px,env(safe-area-inset-left))+14px)] z-30 flex items-center gap-1">
          {progress}
        </div>
      ) : null}

      <main
        className={cn(
          isSplit
            ? 'fixed top-[calc(var(--top)+var(--top-h)+var(--bar-h)+10px)] right-(--frame-r) bottom-0 left-[calc(var(--frame-l)+var(--side-w))] z-[1] grid grid-cols-2'
            : 'wide:max-w-[calc(1240px+var(--side-w))] wide:pt-[calc(var(--top)+var(--top-h)+var(--bar-h)+40px)] wide:pb-20 wide:pl-[calc(var(--side-w)+34px)] relative z-[1] mx-auto max-w-[760px] px-[18px] pt-[calc(var(--top)+var(--top-h)+40px)] pb-[calc(var(--dock-h)+48px+env(safe-area-inset-bottom))]'
        )}
      >
        {children}
      </main>

      <nav className="wide:hidden pointer-events-none fixed right-[max(10px,env(safe-area-inset-right))] bottom-(--bottom) left-[max(10px,env(safe-area-inset-left))] z-30 mx-auto flex h-(--dock-h) max-w-[560px] items-center gap-1.5 *:pointer-events-auto">
        {dock}
      </nav>
    </div>
  );
}
