import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { keyboardInset, useKeyboardInset } from './use-keyboard-inset';

describe('keyboardInset', () => {
  it('is the part of the layout viewport the visual viewport no longer covers', () => {
    expect(keyboardInset(800, { height: 500, offsetTop: 0 })).toBe(300);
    expect(keyboardInset(800, { height: 500, offsetTop: 40 })).toBe(260);
  });

  it('is never negative', () => {
    expect(keyboardInset(800, { height: 800, offsetTop: 0 })).toBe(0);
    expect(keyboardInset(800, { height: 820, offsetTop: 0 })).toBe(0);
  });
});

describe('useKeyboardInset', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty('--kb');
  });

  it('sets --kb while mounted and follows the visual viewport', () => {
    const viewport = Object.assign(new EventTarget(), { height: 500, offsetTop: 0 });
    vi.stubGlobal('visualViewport', viewport);
    vi.stubGlobal('innerHeight', 800);

    const { unmount } = renderHook(() => useKeyboardInset());
    expect(document.documentElement.style.getPropertyValue('--kb')).toBe('300px');

    viewport.height = 800;
    viewport.dispatchEvent(new Event('resize'));
    expect(document.documentElement.style.getPropertyValue('--kb')).toBe('0px');

    unmount();
    expect(document.documentElement.style.getPropertyValue('--kb')).toBe('');
  });
});
