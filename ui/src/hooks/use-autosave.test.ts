import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAutosave } from './use-autosave';

type Props = { value: string; enabled?: boolean };

type Save = (value: string) => Promise<unknown>;
const mockSave = () => vi.fn<Save>().mockResolvedValue(undefined);
const finishers: (() => void)[] = [];
const hang = () =>
  new Promise<void>((resolve) => {
    finishers.push(resolve);
  });

const setup = (save: (value: string) => Promise<unknown>, initial: Props = { value: 'one' }) =>
  renderHook(({ value, enabled }: Props) => useAutosave({ value, save, delayMs: 500, enabled }), {
    initialProps: initial,
  });

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not save the value it starts with', async () => {
    const save = mockSave();
    const { result } = setup(save);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe('saved');
  });

  it('saves once after the value has been still, reporting saving then saved', async () => {
    const save = mockSave();
    const { result, rerender } = setup(save);

    rerender({ value: 'two' });
    expect(result.current.status).toBe('saving');
    await act(() => vi.advanceTimersByTimeAsync(300));
    rerender({ value: 'three' });
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(save).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('three');
    expect(result.current.status).toBe('saved');
  });

  it('keeps saving while a request is in flight and then sends the newest value', async () => {
    const save = mockSave().mockImplementationOnce(hang);
    const { result, rerender } = setup(save);

    rerender({ value: 'two' });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(save).toHaveBeenCalledTimes(1);

    rerender({ value: 'three' });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('saving');

    await act(async () => finishers.shift()?.());
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith('three');
    expect(result.current.status).toBe('saved');
  });

  it('reports an error without retrying on its own, and saves again on a new value or retry', async () => {
    const save = mockSave().mockRejectedValueOnce(new Error('offline'));
    const { result, rerender } = setup(save);

    rerender({ value: 'two' });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(result.current.status).toBe('error');
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.retry();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('saved');
  });

  it('holds saving back while disabled', async () => {
    const save = mockSave();
    const { result, rerender } = setup(save);

    rerender({ value: '', enabled: false });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe('paused');

    rerender({ value: 'two', enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(save).toHaveBeenCalledWith('two');
  });

  it('flushes pending edits at once and reports whether it worked', async () => {
    const save = mockSave();
    const { result, rerender } = setup(save);

    rerender({ value: 'two' });
    let ok = false;
    await act(async () => {
      ok = await result.current.flush();
    });
    expect(ok).toBe(true);
    expect(save).toHaveBeenCalledWith('two');
    expect(save).toHaveBeenCalledTimes(1);

    save.mockRejectedValueOnce(new Error('offline'));
    rerender({ value: 'three' });
    await act(async () => {
      ok = await result.current.flush();
    });
    expect(ok).toBe(false);
  });

  it('saves pending edits when the editor unmounts', async () => {
    const save = mockSave();
    const { rerender, unmount } = setup(save);

    rerender({ value: 'two' });
    unmount();
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledWith('two');
  });
});
