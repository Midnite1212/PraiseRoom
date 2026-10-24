import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScrollingClass } from './use-scrolling-class';

const isScrolling = () => document.documentElement.classList.contains('scrolling');

describe('useScrollingClass', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('marks the page while it scrolls and clears once it has been still', () => {
    renderHook(() => useScrollingClass());
    document.dispatchEvent(new Event('scroll'));
    expect(isScrolling()).toBe(true);
    vi.advanceTimersByTime(100);
    document.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(100);
    expect(isScrolling()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(isScrolling()).toBe(false);
  });

  it('counts a pane scrolling on its own', () => {
    renderHook(() => useScrollingClass());
    const pane = document.body.appendChild(document.createElement('div'));
    pane.dispatchEvent(new Event('scroll'));
    expect(isScrolling()).toBe(true);
  });

  it('ignores scrolling inside a sheet', () => {
    renderHook(() => useScrollingClass());
    const sheet = document.body.appendChild(document.createElement('div'));
    sheet.setAttribute('role', 'dialog');
    const list = sheet.appendChild(document.createElement('div'));
    list.dispatchEvent(new Event('scroll'));
    expect(isScrolling()).toBe(false);
  });

  it('clears the mark when the reader closes mid-scroll', () => {
    const { unmount } = renderHook(() => useScrollingClass());
    document.dispatchEvent(new Event('scroll'));
    unmount();
    expect(isScrolling()).toBe(false);
  });
});
