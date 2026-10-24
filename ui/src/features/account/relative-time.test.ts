import { describe, expect, it } from 'vitest';

import { formatRelative } from './relative-time';

const NOW = Date.parse('2026-06-12T12:00:00Z');

describe('formatRelative', () => {
  it('counts days, hours and minutes back from now', () => {
    expect(formatRelative('2026-06-10T12:00:00Z', NOW, 'en-GB', 'now')).toBe('2 days ago');
    expect(formatRelative('2026-06-12T09:00:00Z', NOW, 'en-GB', 'now')).toBe('3 hours ago');
    expect(formatRelative('2026-06-12T11:30:00Z', NOW, 'en-GB', 'now')).toBe('30 minutes ago');
  });

  it('falls back to the given text under a minute or for a bad date', () => {
    expect(formatRelative('2026-06-12T11:59:40Z', NOW, 'en-GB', 'just now')).toBe('just now');
    expect(formatRelative('nope', NOW, 'en-GB', 'just now')).toBe('just now');
  });

  it('follows the locale', () => {
    expect(formatRelative('2026-06-10T12:00:00Z', NOW, 'zh-Hant', 'now')).toBe('前天');
  });
});
