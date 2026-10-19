const LAST_RELOAD_KEY = 'stale-chunk-reload-at';
const MIN_RELOAD_INTERVAL_MS = 10_000;

// After a deploy, an open tab can request a code chunk that no longer exists. Reloading picks up the
// new build; the interval guard stops a reload loop if the chunk is genuinely broken.
export const shouldReloadForStaleChunk = (now: number, lastReloadAt: number | null): boolean =>
  lastReloadAt === null || now - lastReloadAt > MIN_RELOAD_INTERVAL_MS;

const readLastReload = (): number | null => {
  try {
    const stored = Number(sessionStorage.getItem(LAST_RELOAD_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  } catch {
    return null;
  }
};

export const reloadForStaleChunk = (): boolean => {
  const now = Date.now();
  if (!shouldReloadForStaleChunk(now, readLastReload())) return false;
  try {
    sessionStorage.setItem(LAST_RELOAD_KEY, String(now));
  } catch {
    // Without storage the guard can't persist; reload anyway, as the old build can't recover.
  }
  window.location.reload();
  return true;
};

export const isStaleChunkError = (error: unknown): boolean =>
  error instanceof Error &&
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error.message
  );

export const listenForStaleChunks = (): void => {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForStaleChunk()) event.preventDefault();
  });
};
