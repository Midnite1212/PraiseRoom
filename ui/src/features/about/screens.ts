import { z } from 'zod';

export const PREVIEW_SCREENS = [
  'library',
  'chart',
  'transpose',
  'setlists',
  'musician',
  'sharing',
  'public',
  'bilingual',
  'demo',
] as const;

export type PreviewScreen = (typeof PREVIEW_SCREENS)[number];

export const previewScreenSchema = z.enum(PREVIEW_SCREENS);

export const DEVICE_FORMS = ['phone', 'tablet', 'desktop', 'tv'] as const;

export type DeviceForm = (typeof DEVICE_FORMS)[number];

export const previewPath = (screen: PreviewScreen): string => `/about/preview/${screen}`;

const SHOW_SCREEN = 'praise-room:preview-show';
const PREVIEW_READY = 'praise-room:preview-ready';

export const showScreenMessage = (screen: PreviewScreen) => ({ type: SHOW_SCREEN, screen });

export const showScreenSchema = z.object({
  type: z.literal(SHOW_SCREEN),
  screen: previewScreenSchema,
});

export const READY_MESSAGE = { type: PREVIEW_READY };

export const readySchema = z.object({ type: z.literal(PREVIEW_READY) });

export const screenForPath = (pathname: string): PreviewScreen | null => {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/setlists') return 'setlists';
  if (path === '/songs') return 'library';
  if (/^\/songs\/[^/]+$/.test(path)) return 'chart';
  if (/^\/setlists\/[^/]+$/.test(path)) return 'musician';
  if (path.startsWith('/folders')) return 'sharing';
  if (path.startsWith('/setlist/view/')) return 'public';
  return null;
};
