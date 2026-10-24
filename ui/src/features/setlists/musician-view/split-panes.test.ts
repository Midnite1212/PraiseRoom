import { describe, expect, it } from 'vitest';

import { pinAfterMove, pinAfterPick, rightPane, rightPickIndexes } from './split-panes';

const ids = ['a', 'b', 'c', 'd'];

describe('rightPane', () => {
  it('follows the next song while nothing is pinned', () => {
    expect(rightPane(ids, 1, null)).toEqual({ index: 2, isPinned: false });
  });

  it('shows the end of the set past the last song', () => {
    expect(rightPane(ids, 3, null)).toEqual({ index: null, isPinned: false });
  });

  it('shows the pinned song wherever it sits in the set', () => {
    expect(rightPane(ids, 2, 'a')).toEqual({ index: 0, isPinned: true });
    expect(rightPane(ids, 3, 'a')).toEqual({ index: 0, isPinned: true });
  });

  it('shows a pinned song even when the left pane is on the last song', () => {
    expect(rightPane(ids, 3, 'b')).toEqual({ index: 1, isPinned: true });
  });

  it('ignores a pin on the song in the left pane', () => {
    expect(rightPane(ids, 1, 'b')).toEqual({ index: 2, isPinned: false });
  });

  it('ignores a pin on a song that is no longer in the set', () => {
    expect(rightPane(ids, 0, 'gone')).toEqual({ index: 1, isPinned: false });
  });

  it('finds a repeated song at its other position', () => {
    expect(rightPane(['a', 'b', 'a'], 0, 'a')).toEqual({ index: 2, isPinned: true });
  });
});

describe('pinAfterPick', () => {
  it('pins the chosen song', () => {
    expect(pinAfterPick(ids, 0, 'c')).toBe('c');
  });

  it('unpins on "follow the set"', () => {
    expect(pinAfterPick(ids, 0, null)).toBeNull();
  });

  it('does not pin the song that follows anyway', () => {
    expect(pinAfterPick(ids, 0, 'b')).toBeNull();
  });
});

describe('pinAfterMove', () => {
  it('keeps the pin while the left pane moves on', () => {
    expect(pinAfterMove(ids, 'd', 1)).toBe('d');
  });

  it('drops the pin once the left pane reaches that song', () => {
    expect(pinAfterMove(ids, 'c', 2)).toBeNull();
  });

  it('stays unpinned', () => {
    expect(pinAfterMove(ids, null, 2)).toBeNull();
  });
});

describe('rightPickIndexes', () => {
  it('lists every position but the left pane song', () => {
    expect(rightPickIndexes(4, 1)).toEqual([0, 2, 3]);
  });
});
