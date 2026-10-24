import { describe, expect, it } from 'vitest';

import { parseUserAgent } from './device';

describe('parseUserAgent', () => {
  it('names a Mac running Chrome', () => {
    expect(
      parseUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )
    ).toEqual({ device: 'Mac', browser: 'Chrome', isPhone: false });
  });

  it('names an iPhone running Safari and an iPhone running Chrome', () => {
    expect(
      parseUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      )
    ).toEqual({ device: 'iPhone', browser: 'Safari', isPhone: true });
    expect(
      parseUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1'
      ).browser
    ).toBe('Chrome');
  });

  it('prefers Edge over Chrome and Firefox over Safari', () => {
    expect(
      parseUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
      )
    ).toEqual({ device: 'Windows', browser: 'Edge', isPhone: false });
    expect(
      parseUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0')
    ).toEqual({ device: 'Linux', browser: 'Firefox', isPhone: false });
  });

  it('treats Android as a phone and an empty agent as unknown', () => {
    expect(
      parseUserAgent('Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile Safari/537.36')
    ).toMatchObject({ device: 'Android', isPhone: true });
    expect(parseUserAgent(null)).toEqual({ device: null, browser: null, isPhone: false });
  });
});
