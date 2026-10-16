import { describe, expect, it } from 'vitest';

import en from './locales/en.json';
import zhHant from './locales/zh-Hant.json';

const keysOf = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => keysOf(child, `${prefix}${key}.`))
    : [prefix.slice(0, -1)];

describe('locales', () => {
  it('translate every English key into Traditional Chinese', () => {
    expect(keysOf(zhHant).toSorted()).toEqual(keysOf(en).toSorted());
  });
});
