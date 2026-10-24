import { createStoredChoice } from '@/lib/stored-choice';

export const RAIL_STATES = ['open', 'folded'] as const;

export type RailState = (typeof RAIL_STATES)[number];

const rail = createStoredChoice('rail', RAIL_STATES, 'open');

export const useRail = rail.use;

export const toggledRail = (state: RailState): RailState => (state === 'open' ? 'folded' : 'open');

export const isRailShortcut = (event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>) =>
  (event.metaKey || event.ctrlKey) && event.key === '\\';

export const railShortcutLabel = (platform: string) =>
  platform.includes('Mac') ? '⌘\\' : 'Ctrl+\\';
