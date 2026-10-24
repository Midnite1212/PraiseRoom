import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { parseSavedOrder, reconcileOrder, useLocalOrder } from './local-order';

describe('reconcileOrder', () => {
  it('keeps the saved order', () => {
    expect(reconcileOrder(['c', 'a', 'b'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b']);
  });

  it('drops songs that left the setlist and appends new ones', () => {
    expect(reconcileOrder(['x', 'b', 'a'], ['a', 'b', 'n'])).toEqual(['b', 'a', 'n']);
  });

  it('ignores repeats in the saved order', () => {
    expect(reconcileOrder(['b', 'b', 'a'], ['a', 'b'])).toEqual(['b', 'a']);
  });

  it('follows the setlist when nothing is saved', () => {
    expect(reconcileOrder([], ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('keeps a song that appears twice in the setlist twice', () => {
    expect(reconcileOrder(['b', 'a'], ['a', 'b', 'a'])).toEqual(['b', 'a', 'a']);
  });
});

describe('parseSavedOrder', () => {
  it('returns an empty order for missing or malformed values', () => {
    expect(parseSavedOrder(null)).toEqual([]);
    expect(parseSavedOrder('not json')).toEqual([]);
    expect(parseSavedOrder('{"a":1}')).toEqual([]);
    expect(parseSavedOrder('[1,2]')).toEqual([]);
    expect(parseSavedOrder('["a","b"]')).toEqual(['a', 'b']);
  });
});

describe('useLocalOrder', () => {
  afterEach(() => localStorage.clear());

  it('saves a custom order per setlist and clears it on reset', () => {
    const ids = ['a', 'b', 'c'];
    const { result } = renderHook(() => useLocalOrder('set-1', ids));
    expect(result.current.isCustom).toBe(false);

    act(() => result.current.setOrder(['c', 'a', 'b']));
    expect(result.current.order).toEqual(['c', 'a', 'b']);
    expect(result.current.isCustom).toBe(true);
    expect(localStorage.getItem('setlist-order:set-1')).toBe('["c","a","b"]');
    expect(renderHook(() => useLocalOrder('set-2', ids)).result.current.isCustom).toBe(false);

    act(() => result.current.reset());
    expect(result.current.order).toEqual(ids);
    expect(localStorage.getItem('setlist-order:set-1')).toBeNull();
  });

  it('stores nothing when the order is put back to the setlist order', () => {
    const ids = ['a', 'b'];
    const { result } = renderHook(() => useLocalOrder('set-1', ids));
    act(() => result.current.setOrder(['b', 'a']));
    act(() => result.current.setOrder(['a', 'b']));
    expect(localStorage.getItem('setlist-order:set-1')).toBeNull();
  });

  it('reconciles a saved order with the current songs', () => {
    localStorage.setItem('setlist-order:set-1', '["gone","b","a"]');
    const { result } = renderHook(() => useLocalOrder('set-1', ['a', 'b', 'new']));
    expect(result.current.order).toEqual(['b', 'a', 'new']);
    expect(result.current.isCustom).toBe(true);
  });
});
