import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { useWakeLock, wakeLockSupported } from './keep-awake';

type FakeSentinel = EventTarget & { release: Mock<() => Promise<void>> };

const makeSentinel = (): FakeSentinel => {
  const sentinel = new EventTarget();
  return Object.assign(sentinel, { release: vi.fn<() => Promise<void>>(() => Promise.resolve()) });
};

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useWakeLock', () => {
  let request: Mock<(type: 'screen') => Promise<FakeSentinel>>;
  let sentinels: FakeSentinel[];

  beforeEach(() => {
    sentinels = [];
    request = vi.fn<(type: 'screen') => Promise<FakeSentinel>>(() => {
      const sentinel = makeSentinel();
      sentinels.push(sentinel);
      return Promise.resolve(sentinel);
    });
    vi.stubGlobal('navigator', { wakeLock: { request } });
    setVisibility('visible');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests a screen lock while enabled and releases it on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));
    await flush();

    expect(request).toHaveBeenCalledWith('screen');
    unmount();
    expect(sentinels[0]?.release).toHaveBeenCalledTimes(1);
  });

  it('does nothing while disabled', async () => {
    renderHook(() => useWakeLock(false));
    await flush();

    expect(request).not.toHaveBeenCalled();
  });

  it('releases when switched off and asks again when switched on', async () => {
    const { rerender } = renderHook(({ on }) => useWakeLock(on), {
      initialProps: { on: true },
    });
    await flush();

    rerender({ on: false });
    expect(sentinels[0]?.release).toHaveBeenCalledTimes(1);

    rerender({ on: true });
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('requests again when the page becomes visible after the browser dropped the lock', async () => {
    renderHook(() => useWakeLock(true));
    await flush();

    setVisibility('hidden');
    sentinels[0]?.dispatchEvent(new Event('release'));
    await flush();
    expect(request).toHaveBeenCalledTimes(1);

    setVisibility('visible');
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not stack locks when the page becomes visible while one is held', async () => {
    renderHook(() => useWakeLock(true));
    await flush();

    setVisibility('visible');
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('does not request while the page is hidden', async () => {
    setVisibility('hidden');
    renderHook(() => useWakeLock(true));
    await flush();

    expect(request).not.toHaveBeenCalled();
  });

  it('releases a lock that arrives after unmount', async () => {
    const late = makeSentinel();
    request.mockImplementationOnce(() => flush().then(() => late));
    const { unmount } = renderHook(() => useWakeLock(true));
    unmount();

    await flush();
    await flush();
    expect(late.release).toHaveBeenCalledTimes(1);
  });

  it('survives a refused request', async () => {
    request.mockRejectedValueOnce(new Error('NotAllowedError'));
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
    await flush();
  });

  it('is a no-op where the Wake Lock API is missing', () => {
    vi.stubGlobal('navigator', {});
    expect(wakeLockSupported()).toBe(false);
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
