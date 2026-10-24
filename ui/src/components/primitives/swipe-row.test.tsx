import { fireEvent, render, screen } from '@testing-library/react';
import { createPortal } from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SwipeRow } from './swipe-row';

const mockPhone = () =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

const renderRow = (onLongPress: () => void) =>
  render(
    <ul>
      <SwipeRow actions={[]} onLongPress={onLongPress}>
        <button type="button">Sunday</button>
      </SwipeRow>
    </ul>
  );

beforeEach(() => {
  vi.useFakeTimers();
  mockPhone();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('SwipeRow long-press', () => {
  it('fires after a 520ms hold and swallows the click that follows', () => {
    const onLongPress = vi.fn<() => void>();
    const onClick = vi.fn<() => void>();
    render(
      <ul>
        <SwipeRow actions={[]} onLongPress={onLongPress}>
          <button type="button" onClick={onClick}>
            Sunday
          </button>
        </SwipeRow>
      </ul>
    );
    const row = screen.getByRole('button', { name: 'Sunday' });
    fireEvent.pointerDown(row, { isPrimary: true, button: 0 });
    vi.advanceTimersByTime(519);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onLongPress).toHaveBeenCalledOnce();
    fireEvent.pointerUp(row);
    fireEvent.click(row);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows the press before it fires', () => {
    renderRow(vi.fn<() => void>());
    const row = screen.getByRole('button', { name: 'Sunday' });
    fireEvent.pointerDown(row, { isPrimary: true, button: 0 });
    vi.advanceTimersByTime(200);
    expect(row.parentElement).toHaveAttribute('data-holding');
    fireEvent.pointerUp(row);
    expect(row.parentElement).not.toHaveAttribute('data-holding');
  });

  it('does not fire for a tap or a hold that moves 8px', () => {
    const onLongPress = vi.fn<() => void>();
    renderRow(onLongPress);
    const row = screen.getByRole('button', { name: 'Sunday' });
    fireEvent.pointerDown(row, { isPrimary: true, button: 0, clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(300);
    fireEvent.pointerUp(row);
    vi.advanceTimersByTime(600);

    fireEvent.pointerDown(row, { isPrimary: true, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(row, { clientX: 10, clientY: 19 });
    vi.advanceTimersByTime(600);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('cancels when the browser takes the gesture for scrolling', () => {
    const onLongPress = vi.fn<() => void>();
    renderRow(onLongPress);
    const row = screen.getByRole('button', { name: 'Sunday' });
    fireEvent.pointerDown(row, { isPrimary: true, button: 0 });
    fireEvent.pointerCancel(row);
    vi.advanceTimersByTime(600);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('leaves clicks inside a portaled menu alone after it fires', () => {
    const onPick = vi.fn<() => void>();
    render(
      <ul>
        <SwipeRow actions={[]} onLongPress={vi.fn<() => void>()}>
          <button type="button">Sunday</button>
          {createPortal(
            <button type="button" onClick={onPick}>
              Duplicate
            </button>,
            document.body
          )}
        </SwipeRow>
      </ul>
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Sunday' }), {
      isPrimary: true,
      button: 0,
    });
    vi.advanceTimersByTime(520);
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    expect(onPick).toHaveBeenCalledOnce();
  });
});
