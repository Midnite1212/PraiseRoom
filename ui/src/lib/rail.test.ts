import { afterEach, describe, expect, it } from 'vitest';

import { isRailShortcut, railShortcutLabel, toggledRail } from './rail';

afterEach(() => {
  localStorage.clear();
});

describe('rail', () => {
  it('flips between open and folded', () => {
    expect(toggledRail('open')).toBe('folded');
    expect(toggledRail('folded')).toBe('open');
  });

  it('answers to Cmd or Ctrl plus backslash only', () => {
    expect(isRailShortcut({ key: '\\', metaKey: true, ctrlKey: false })).toBe(true);
    expect(isRailShortcut({ key: '\\', metaKey: false, ctrlKey: true })).toBe(true);
    expect(isRailShortcut({ key: '\\', metaKey: false, ctrlKey: false })).toBe(false);
    expect(isRailShortcut({ key: 'b', metaKey: true, ctrlKey: false })).toBe(false);
  });

  it('names the shortcut for the platform', () => {
    expect(railShortcutLabel('MacIntel')).toBe('⌘\\');
    expect(railShortcutLabel('Win32')).toBe('Ctrl+\\');
  });
});
