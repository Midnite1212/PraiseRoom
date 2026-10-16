import { describe, expect, it } from 'vitest';

import { fromDateInputValue, toDateInputValue } from './format-date';

describe('date input helpers', () => {
  it('round-trips a calendar day through the stored instant', () => {
    const stored = fromDateInputValue('2026-10-15');
    expect(stored).not.toBeNull();
    expect(toDateInputValue(stored)).toBe('2026-10-15');
  });

  it('treats empty or malformed values as no date', () => {
    expect(fromDateInputValue('')).toBeNull();
    expect(fromDateInputValue('15/10/2026')).toBeNull();
    expect(toDateInputValue(null)).toBe('');
    expect(toDateInputValue('not a date')).toBe('');
  });
});
