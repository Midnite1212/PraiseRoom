import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_LYRICS_SIZE,
  readLyricsSize,
  setLyricsSize,
  stepLyricsSize,
  useLyricsSize,
} from './lyrics-size';

afterEach(() => {
  localStorage.clear();
});

describe('lyrics size', () => {
  it('defaults to medium and ignores unknown stored values', () => {
    expect(readLyricsSize()).toBe(DEFAULT_LYRICS_SIZE);
    localStorage.setItem('lyrics-size', 'huge');
    expect(readLyricsSize()).toBe(DEFAULT_LYRICS_SIZE);
  });

  it('persists the chosen size and updates subscribers', () => {
    const { result } = renderHook(() => useLyricsSize());
    act(() => setLyricsSize('xl'));
    expect(result.current[0]).toBe('xl');
    expect(localStorage.getItem('lyrics-size')).toBe('xl');
  });

  it('steps within the available sizes', () => {
    expect(stepLyricsSize('md', 1)).toBe('lg');
    expect(stepLyricsSize('sm', -1)).toBe('sm');
    expect(stepLyricsSize('2xl', 1)).toBe('2xl');
  });
});
