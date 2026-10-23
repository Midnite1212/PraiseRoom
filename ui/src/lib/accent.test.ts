import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_ACCENT, syncAccent } from './accent';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.palette;
});

describe('accent', () => {
  it('marks <html> with Electric blue by default and ignores unknown stored values', () => {
    localStorage.setItem('accent', 'neon-pink');
    const stop = syncAccent();
    expect(document.documentElement.dataset.palette).toBe(DEFAULT_ACCENT);
    stop();
  });

  it('follows the stored choice', () => {
    localStorage.setItem('accent', 'volt');
    const stop = syncAccent();
    expect(document.documentElement.dataset.palette).toBe('volt');
    stop();
  });
});
