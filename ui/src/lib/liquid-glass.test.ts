import { afterEach, describe, expect, it } from 'vitest';

import { canRefract, syncGlassStyle } from './liquid-glass';

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('refract');
});

describe('liquid glass', () => {
  it('stays frosted by default', () => {
    const stop = syncGlassStyle();
    expect(document.documentElement.classList.contains('refract')).toBe(false);
    stop();
  });

  it('stays frosted where the browser cannot refract, even when refraction is chosen', () => {
    localStorage.setItem('glass', 'refract');
    const stop = syncGlassStyle();
    expect(canRefract()).toBe(false);
    expect(document.documentElement.classList.contains('refract')).toBe(false);
    stop();
  });
});
