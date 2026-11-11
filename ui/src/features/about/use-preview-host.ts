import { useBlocker, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { followStoredLanguage } from '@/i18n';

import { type PreviewScreen, READY_MESSAGE, screenForPath, showScreenSchema } from './screens';

export function usePreviewHost() {
  const navigate = useNavigate();
  const show = (screen: PreviewScreen) =>
    void navigate({ to: '/about/preview/$screen', params: { screen }, replace: true });

  useBlocker({
    shouldBlockFn: ({ next }) => {
      if (next.pathname.startsWith('/about/preview/')) return false;
      const screen = screenForPath(next.pathname);
      if (screen) queueMicrotask(() => show(screen));
      return true;
    },
    enableBeforeUnload: false,
  });

  useEffect(() => followStoredLanguage(), []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('no-scrollbar');
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const message = showScreenSchema.safeParse(event.data);
      if (message.success) {
        void navigate({
          to: '/about/preview/$screen',
          params: { screen: message.data.screen },
          replace: true,
        });
      }
    };
    window.addEventListener('message', onMessage);
    if (window.parent !== window) window.parent.postMessage(READY_MESSAGE, window.location.origin);
    return () => {
      window.removeEventListener('message', onMessage);
      root.classList.remove('no-scrollbar');
    };
  }, [navigate]);
}
