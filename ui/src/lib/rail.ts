import { createStoredChoice } from '@/lib/stored-choice';

export const RAIL_STATES = ['open', 'folded'] as const;

export type RailState = (typeof RAIL_STATES)[number];

const rail = createStoredChoice('rail', RAIL_STATES, 'open');

export const useRail = rail.use;

// Below this width an open rail leaves the page too little room, so the rail stays folded.
export const RAIL_FOLD_QUERY = '(max-width: 1279px)';

export const toggledRail = (state: RailState): RailState => (state === 'open' ? 'folded' : 'open');

export const isRailShortcut = (event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>) =>
  (event.metaKey || event.ctrlKey) && event.key === '\\';

export const railShortcutLabel = (platform: string) =>
  platform.includes('Mac') ? '⌘\\' : 'Ctrl+\\';
