import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_TYPEFACE, readTypeface, setTypeface, syncTypeface } from './typeface';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.typeface;
});

describe('typeface', () => {
  it('defaults to Geist and ignores unknown stored values', () => {
    expect(readTypeface()).toBe(DEFAULT_TYPEFACE);
    localStorage.setItem('typeface', 'comic-sans');
    expect(readTypeface()).toBe('geist');
  });

  it('marks <html> with the stored choice and follows later changes', () => {
    localStorage.setItem('typeface', 'pixel');
    const stop = syncTypeface();
    expect(document.documentElement.dataset.typeface).toBe('pixel');

    setTypeface('hanken-grotesk');
    expect(document.documentElement.dataset.typeface).toBe('hanken-grotesk');
    expect(localStorage.getItem('typeface')).toBe('hanken-grotesk');

    stop();
    setTypeface('mono');
    expect(document.documentElement.dataset.typeface).toBe('hanken-grotesk');
  });
});
