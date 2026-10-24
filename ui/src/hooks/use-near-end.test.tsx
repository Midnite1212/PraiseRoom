import { render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useNearEnd } from './use-near-end';

type Callback = (entries: { isIntersecting: boolean }[]) => void;

const observers: { callback: Callback; options: IntersectionObserverInit | undefined }[] = [];
const disconnect = vi.fn<() => void>();

class FakeObserver {
  constructor(callback: Callback, options?: IntersectionObserverInit) {
    observers.push({ callback, options });
  }
  observe = vi.fn<() => void>();
  disconnect = disconnect;
}

function Probe({ enabled, onNear }: { enabled: boolean; onNear: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useNearEnd(ref, { enabled, onNear });
  return <div ref={ref} />;
}

afterEach(() => {
  observers.length = 0;
  disconnect.mockClear();
  vi.unstubAllGlobals();
});

describe('useNearEnd', () => {
  it('calls back when the end comes within the margin of the viewport', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const onNear = vi.fn<() => void>();
    render(<Probe enabled onNear={onNear} />);

    expect(observers[0]?.options?.rootMargin).toBe('0px 0px 600px 0px');
    observers[0]?.callback([{ isIntersecting: false }]);
    expect(onNear).not.toHaveBeenCalled();
    observers[0]?.callback([{ isIntersecting: true }]);
    expect(onNear).toHaveBeenCalledTimes(1);
  });

  it('does not observe while disabled', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    render(<Probe enabled={false} onNear={vi.fn<() => void>()} />);

    expect(observers).toHaveLength(0);
  });

  it('stops observing on unmount', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    render(<Probe enabled onNear={vi.fn<() => void>()} />).unmount();

    expect(disconnect).toHaveBeenCalled();
  });
});
