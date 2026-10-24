import { describe, expect, it } from 'vitest';

import { toSlug, urlKeyFromSlug, withUrlKey } from './slug';

describe('toSlug', () => {
  it.each([
    ['Amazing Grace', 'amazing-grace'],
    ['奇異恩典', '奇異恩典'],
    ['奇異恩典 Amazing Grace', '奇異恩典-amazing-grace'],
    ['  Way Maker (Live!) ', 'way-maker-live'],
    ['Ｆｕｌｌ　Ｗｉｄｔｈ', 'full-width'],
    ['Café', 'café'],
    ['!!!', ''],
  ])('maps %p to %p', (text, expected) => {
    expect(toSlug(text)).toBe(expected);
  });

  it('caps the length without leaving a trailing hyphen', () => {
    const slug = toSlug(`${'a'.repeat(59)} b`);
    expect(slug).toBe('a'.repeat(59));
  });
});

describe('withUrlKey', () => {
  it('appends the key, or uses the key alone when the name has no slug', () => {
    expect(withUrlKey('Youth Band', 'p8w2nz')).toBe('youth-band-p8w2nz');
    expect(withUrlKey('🎵', 'p8w2nz')).toBe('p8w2nz');
  });
});

describe('urlKeyFromSlug', () => {
  it.each([
    ['amazing-grace-k3x9p2', 'k3x9p2'],
    ['奇異恩典-k3x9p2', 'k3x9p2'],
    ['k3x9p2', 'k3x9p2'],
    ['old-name-K3X9P2', 'k3x9p2'],
    ['amazing-grace', null],
    ['gracek3x9p2', null],
    ['', null],
  ])('maps %p to %p', (slug, expected) => {
    expect(urlKeyFromSlug(slug)).toBe(expected);
  });
});
