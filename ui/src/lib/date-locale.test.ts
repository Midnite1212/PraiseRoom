import { describe, expect, it } from 'vitest';

import { dateLocale } from './date-locale';

describe('dateLocale', () => {
  it('orders English dates day first and leaves other languages alone', () => {
    expect(dateLocale('en')).toBe('en-GB');
    expect(dateLocale('zh-Hant')).toBe('zh-Hant');
    expect(
      new Intl.DateTimeFormat(dateLocale('en'), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(2026, 9, 24))
    ).toBe('Saturday 24 October');
  });
});
