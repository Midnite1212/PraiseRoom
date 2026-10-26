import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAutoScroller,
  PIXELS_PER_SECOND,
  readScrollSpeed,
  setScrollSpeed,
  useAutoScroll,
  useScrollSpeed,
} from './auto-scroll';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

function setup(pixelsPerSecond: number, endAt = Infinity) {
  let position = 0;
  const onEnd = vi.fn<() => void>();
  const scroller = createAutoScroller({
    pixelsPerSecond,
    scrollBy: (pixels) => {
      position += pixels;
    },
    isAtEnd: () => position >= endAt,
    onEnd,
  });
  return { scroller, onEnd, position: () => position };
}

describe('createAutoScroller', () => {
  it('moves at the chosen rate, carrying the fraction between frames', () => {
    const { scroller, position } = setup(PIXELS_PER_SECOND.slow);
    scroller.start();
    vi.advanceTimersByTime(10_000);
    expect(position()).toBeGreaterThanOrEqual(PIXELS_PER_SECOND.slow * 10 - 2);
    expect(position()).toBeLessThanOrEqual(PIXELS_PER_SECOND.slow * 10);
  });

  it('scrolls faster at a faster speed', () => {
    const slow = setup(PIXELS_PER_SECOND.slow);
    const fast = setup(PIXELS_PER_SECOND.fast);
    slow.scroller.start();
    fast.scroller.start();
    vi.advanceTimersByTime(5000);
    expect(fast.position()).toBeGreaterThan(slow.position() * 2);
  });

  it('stops moving after stop', () => {
    const { scroller, position } = setup(PIXELS_PER_SECOND.fast);
    scroller.start();
    vi.advanceTimersByTime(1000);
    scroller.stop();
    const stoppedAt = position();
    vi.advanceTimersByTime(1000);
    expect(position()).toBe(stoppedAt);
  });

  it('stops at the end and reports it once', () => {
    const { scroller, onEnd, position } = setup(PIXELS_PER_SECOND.fast, 100);
    scroller.start();
    vi.advanceTimersByTime(10_000);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(position()).toBeLessThan(100 + PIXELS_PER_SECOND.fast);
  });

  it('caps a long gap between frames so the page does not jump', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback)
    );
    const { scroller, position } = setup(PIXELS_PER_SECOND.fast);
    scroller.start();
    frames.shift()?.(0);
    frames.shift()?.(1000);
    expect(position()).toBe(Math.floor(PIXELS_PER_SECOND.fast * 0.1));
    vi.unstubAllGlobals();
  });

  it('ignores a second start while running', () => {
    const { scroller, position } = setup(PIXELS_PER_SECOND.med);
    scroller.start();
    scroller.start();
    vi.advanceTimersByTime(1000);
    expect(position()).toBeLessThanOrEqual(PIXELS_PER_SECOND.med);
  });
});

describe('scroll speed', () => {
  it('defaults to medium and ignores unknown stored values', () => {
    expect(readScrollSpeed()).toBe('med');
    localStorage.setItem('auto-scroll-speed', 'warp');
    expect(readScrollSpeed()).toBe('med');
  });

  it('persists the chosen speed and updates subscribers', () => {
    const { result } = renderHook(() => useScrollSpeed());
    act(() => setScrollSpeed('fast'));
    expect(result.current[0]).toBe('fast');
    expect(localStorage.getItem('auto-scroll-speed')).toBe('fast');
  });
});

const render = (songKey: string) =>
  renderHook(({ key }) => useAutoScroll(key), {
    initialProps: { key: songKey },
  });

describe('useAutoScroll', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(100_000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls the page while running and stops when toggled off', () => {
    const { result } = render('a');
    act(() => result.current.toggle());
    expect(result.current.running).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(window.scrollBy).toHaveBeenCalled();
    act(() => result.current.toggle());
    expect(result.current.running).toBe(false);
  });

  it('pauses when the reader scrolls by hand', () => {
    const { result } = render('a');
    act(() => result.current.toggle());
    act(() => {
      window.dispatchEvent(new WheelEvent('wheel'));
    });
    expect(result.current.running).toBe(false);
  });

  it('keeps going when a control is used', () => {
    const { result } = render('a');
    act(() => result.current.toggle());
    const button = document.body.appendChild(document.createElement('button'));
    act(() => {
      button.dispatchEvent(new Event('touchmove', { bubbles: true }));
    });
    expect(result.current.running).toBe(true);
    button.remove();
  });

  it('stops when the song changes', () => {
    const { result, rerender } = render('a');
    act(() => result.current.toggle());
    rerender({ key: 'b' });
    expect(result.current.running).toBe(false);
  });

  it('scrolls its own pane instead of the page when given one', () => {
    const scrollBy = vi.fn<(options: ScrollToOptions) => void>();
    const pane = Object.assign(document.createElement('div'), { scrollBy });
    vi.spyOn(pane, 'scrollHeight', 'get').mockReturnValue(100_000);
    const { result } = renderHook(() => useAutoScroll('a', pane));
    act(() => result.current.toggle());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(scrollBy).toHaveBeenCalled();
    expect(window.scrollBy).not.toHaveBeenCalled();
  });
});
