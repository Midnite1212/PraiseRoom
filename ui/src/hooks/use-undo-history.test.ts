import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useUndoHistory } from './use-undo-history';

describe('useUndoHistory', () => {
  it('steps back through every change and stops when empty', () => {
    const { result } = renderHook(() => useUndoHistory('a'));
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    expect(result.current.value).toBe('c');

    act(() => result.current.undo());
    expect(result.current.value).toBe('b');
    act(() => result.current.undo());
    expect(result.current.value).toBe('a');
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.undo());
    expect(result.current.value).toBe('a');
  });

  it('ignores a set that changes nothing', () => {
    const { result } = renderHook(() => useUndoHistory('a'));
    act(() => result.current.set('a'));
    expect(result.current.canUndo).toBe(false);
  });

  it('keeps the last 60 steps', () => {
    const { result } = renderHook(() => useUndoHistory(0));
    for (let step = 1; step <= 70; step += 1) act(() => result.current.set(step));
    for (let step = 0; step < 100; step += 1) act(() => result.current.undo());
    expect(result.current.value).toBe(10);
  });

  it('counts edits with the same coalesce key as one step until the key ends', () => {
    const { result } = renderHook(() => useUndoHistory('a'));
    act(() => result.current.set('ab', { coalesceKey: 'title' }));
    act(() => result.current.set('abc', { coalesceKey: 'title' }));
    act(() => result.current.endCoalesce());
    act(() => result.current.set('abcd', { coalesceKey: 'title' }));

    act(() => result.current.undo());
    expect(result.current.value).toBe('abc');
    act(() => result.current.undo());
    expect(result.current.value).toBe('a');
  });

  it('starts a new step when the coalesce key changes', () => {
    const { result } = renderHook(() => useUndoHistory('a'));
    act(() => result.current.set('b', { coalesceKey: 'title' }));
    act(() => result.current.set('c', { coalesceKey: 'artist' }));
    act(() => result.current.undo());
    expect(result.current.value).toBe('b');
  });

  it('clears the history on reset', () => {
    const { result } = renderHook(() => useUndoHistory('a'));
    act(() => result.current.set('b'));
    act(() => result.current.reset('z'));
    expect(result.current.value).toBe('z');
    expect(result.current.canUndo).toBe(false);
  });
});
