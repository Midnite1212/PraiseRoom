import { afterEach, describe, expect, it, vi } from 'vitest';

import { liquidOffset, syncLiquidPointer } from './liquid-pointer';

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

const setup = () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) => {
    run(0);
    return 1;
  });
  const button = document.createElement('button');
  document.body.append(button);
  return { button, stop: syncLiquidPointer() };
};

describe('liquidOffset', () => {
  const box = { left: 100, top: 50, width: 200, height: 40 };

  it('puts the highlight across the element and near its top edge', () => {
    expect(liquidOffset({ x: 200, y: 50 }, box)).toEqual({ mx: '50.0%', my: '-30.0%' });
    expect(liquidOffset({ x: 300, y: 90 }, box)).toEqual({ mx: '100.0%', my: '10.0%' });
  });

  it('centres across an empty box', () => {
    expect(liquidOffset({ x: 0, y: 0 }, { left: 0, top: 0, width: 0, height: 0 })).toEqual({
      mx: '50.0%',
      my: '-30.0%',
    });
  });
});

describe('syncLiquidPointer', () => {
  it('sets the highlight on the nearest control under the mouse and clears it on leave', () => {
    const { button, stop } = setup();
    button.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 5 })
    );
    expect(button.style.getPropertyValue('--mx')).not.toBe('');
    document.documentElement.dispatchEvent(new PointerEvent('pointerleave'));
    expect(button.style.getPropertyValue('--mx')).toBe('');
    stop();
  });

  it('ignores touch', () => {
    const { button, stop } = setup();
    button.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch', clientX: 5 })
    );
    expect(button.style.getPropertyValue('--mx')).toBe('');
    stop();
  });
});
