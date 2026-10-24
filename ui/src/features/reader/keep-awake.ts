import { useEffect } from 'react';

import { createStoredChoice } from '@/lib/stored-choice';

export const KEEP_AWAKE_CHOICES = ['on', 'off'] as const;

export const useKeepAwake = createStoredChoice('keep-awake', KEEP_AWAKE_CHOICES, 'on').use;

export const wakeLockSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

// Holds a screen wake lock while `enabled` and the page is visible. The browser drops the lock when the
// page is hidden, so it is requested again on return, and released when the reader closes.
export const useWakeLock = (enabled: boolean): void => {
  useEffect(() => {
    if (!enabled || !wakeLockSupported()) return undefined;

    let sentinel: WakeLockSentinel | null = null;
    let active = true;

    const request = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (!active) {
          await next.release();
          return;
        }
        sentinel = next;
        next.addEventListener('release', () => {
          if (sentinel === next) sentinel = null;
        });
      } catch {
        // Refused (low battery, power saver): the screen just dims as usual.
      }
    };

    const sync = () => {
      void request();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', sync);
      sentinel?.release().catch(() => undefined);
      sentinel = null;
    };
  }, [enabled]);
};
