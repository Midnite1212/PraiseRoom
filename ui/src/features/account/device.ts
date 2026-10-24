export type DeviceInfo = {
  device: string | null;
  browser: string | null;
  isPhone: boolean;
};

const DEVICES: readonly { pattern: RegExp; name: string; isPhone: boolean }[] = [
  { pattern: /iPhone/, name: 'iPhone', isPhone: true },
  { pattern: /iPad/, name: 'iPad', isPhone: true },
  { pattern: /Android/, name: 'Android', isPhone: true },
  { pattern: /Windows/, name: 'Windows', isPhone: false },
  { pattern: /CrOS/, name: 'Chromebook', isPhone: false },
  { pattern: /Macintosh|Mac OS X/, name: 'Mac', isPhone: false },
  { pattern: /Linux/, name: 'Linux', isPhone: false },
];

// Order matters: Edge, Opera and Chrome on iOS all carry "Chrome" or "Safari" in their user agent too.
const BROWSERS: readonly { pattern: RegExp; name: string }[] = [
  { pattern: /Edg(?:e|A|iOS)?\//, name: 'Edge' },
  { pattern: /OPR\/|Opera/, name: 'Opera' },
  { pattern: /Firefox\/|FxiOS\//, name: 'Firefox' },
  { pattern: /Chrome\/|CriOS\//, name: 'Chrome' },
  { pattern: /Safari\//, name: 'Safari' },
];

export const parseUserAgent = (userAgent: string | null | undefined): DeviceInfo => {
  const agent = userAgent ?? '';
  const device = DEVICES.find(({ pattern }) => pattern.test(agent));
  const browser = BROWSERS.find(({ pattern }) => pattern.test(agent));
  return {
    device: device?.name ?? null,
    browser: browser?.name ?? null,
    isPhone: device?.isPhone ?? false,
  };
};
