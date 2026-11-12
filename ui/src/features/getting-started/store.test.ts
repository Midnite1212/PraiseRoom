import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  finishGettingStarted,
  markStepDone,
  readGettingStarted,
  setGettingStartedDismissed,
} from './store';

const STORAGE_KEY = 'getting-started';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('getting-started store', () => {
  it('reads an empty progress when nothing is stored', () => {
    expect(readGettingStarted('user-1')).toEqual({ done: [], dismissed: false, finished: false });
  });

  it('records each step once, per user', () => {
    markStepDone('user-1', 'openSong');
    markStepDone('user-1', 'openSong');
    markStepDone('user-2', 'shareLink');
    expect(readGettingStarted('user-1').done).toEqual(['openSong']);
    expect(readGettingStarted('user-2').done).toEqual(['shareLink']);
  });

  it('keeps dismissed and finished beside the steps', () => {
    markStepDone('user-1', 'changeKey');
    setGettingStartedDismissed('user-1', true);
    finishGettingStarted('user-1');
    expect(readGettingStarted('user-1')).toEqual({
      done: ['changeKey'],
      dismissed: true,
      finished: true,
    });
    setGettingStartedDismissed('user-1', false);
    expect(readGettingStarted('user-1').dismissed).toBe(false);
  });

  it('ignores unknown steps and malformed values', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ 'user-1': { done: ['openSong', 'flyToMoon', 3], dismissed: 'yes' } })
    );
    expect(readGettingStarted('user-1')).toEqual({
      done: ['openSong'],
      dismissed: false,
      finished: false,
    });
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(readGettingStarted('user-1').done).toEqual([]);
  });

  it('keeps progress for the visit when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    markStepDone('blocked-user', 'personalize');
    expect(readGettingStarted('blocked-user').done).toEqual(['personalize']);
  });

  it('does not write when nothing changes', () => {
    markStepDone('user-1', 'openSong');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    markStepDone('user-1', 'openSong');
    finishGettingStarted('user-1');
    finishGettingStarted('user-1');
    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
