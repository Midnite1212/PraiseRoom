import { describe, expect, it } from 'vitest';

import { isStaleChunkError, shouldReloadForStaleChunk } from './reload-on-stale-chunk';

describe('reload on a stale chunk', () => {
  it('reloads the first time and not again within ten seconds', () => {
    expect(shouldReloadForStaleChunk(50_000, null)).toBe(true);
    expect(shouldReloadForStaleChunk(55_000, 50_000)).toBe(false);
    expect(shouldReloadForStaleChunk(61_000, 50_000)).toBe(true);
  });

  it('recognises failed chunk imports across browsers', () => {
    for (const message of [
      'Failed to fetch dynamically imported module: https://example.test/assets/_app-old.js',
      'Importing a module script failed.',
      'error loading dynamically imported module',
    ]) {
      expect(isStaleChunkError(new TypeError(message))).toBe(true);
    }
    expect(isStaleChunkError(new Error('Request failed with status 500'))).toBe(false);
    expect(isStaleChunkError('not an error')).toBe(false);
  });
});
