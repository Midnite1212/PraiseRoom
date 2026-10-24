import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { readSongCapo, useSongCapo } from './song-capo';

describe('useSongCapo', () => {
  afterEach(() => localStorage.clear());

  it('defaults to the song saved capo, then to none', () => {
    expect(renderHook(() => useSongCapo('song-1', 3)).result.current[0]).toBe(3);
    expect(renderHook(() => useSongCapo('song-1', null)).result.current[0]).toBe(0);
  });

  it('stores the capo per song id and clears it back to the default', () => {
    const { result } = renderHook(() => useSongCapo('song-1', 3));
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(readSongCapo('song-1')).toBe(5);
    expect(renderHook(() => useSongCapo('song-2', null)).result.current[0]).toBe(0);

    act(() => result.current[1](null));
    expect(result.current[0]).toBe(3);
    expect(readSongCapo('song-1')).toBeNull();
  });

  it('ignores stored values outside 0 to 9 and malformed storage', () => {
    localStorage.setItem(
      'song-capos',
      JSON.stringify({ 'song-1': 12, 'song-2': 'x', 'song-3': 4 })
    );
    expect(readSongCapo('song-1')).toBeNull();
    expect(readSongCapo('song-2')).toBeNull();
    expect(readSongCapo('song-3')).toBe(4);
    localStorage.setItem('song-capos', '{oops');
    expect(readSongCapo('song-3')).toBeNull();
  });
});
