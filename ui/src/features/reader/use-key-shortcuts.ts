import { useEffect } from 'react';

import type { MusicKey } from '@/features/chords/theory';

import { keyForShortcut } from './key-shortcut';

const IGNORED_TARGETS =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]';

const isIgnoredTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(IGNORED_TARGETS) !== null;

// Changes key from the keyboard without opening the key picker. Pass null keys to turn it off.
export function useKeyShortcuts(
  originalKey: MusicKey | null,
  playKey: MusicKey | null,
  onChange: (key: MusicKey) => void
) {
  useEffect(() => {
    if (!originalKey || !playKey) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.altKey || event.ctrlKey || event.metaKey || isIgnoredTarget(event.target)) return;
      const next = keyForShortcut(event.key, originalKey, playKey);
      if (next) onChange(next);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
}
