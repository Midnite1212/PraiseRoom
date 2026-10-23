import { afterEach, describe, expect, it } from 'vitest';

import { brandLogoUrl, DEFAULT_ACCENT, syncAccent } from './accent';

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

  it('points the brand icons at the logo in the chosen accent', () => {
    document.head.insertAdjacentHTML(
      'beforeend',
      '<link rel="icon" href="/brand/praise-room-electric.png" data-brand-icon />'
    );
    localStorage.setItem('accent', 'signal');
    const stop = syncAccent();
    expect(document.querySelector('link[data-brand-icon]')?.getAttribute('href')).toBe(
      brandLogoUrl('signal')
    );
    stop();
    document.querySelector('link[data-brand-icon]')?.remove();
  });
});
