import { describe, expect, it } from 'vitest';

import { toSearchKeyword } from './song-search';

describe('toSearchKeyword', () => {
  it('trims plain searches', () => {
    expect(toSearchKeyword('  Invented Song ')).toBe('Invented Song');
  });

  it('drops the query string and hash from a pasted chord-site link', () => {
    expect(
      toSearchKeyword(
        'https://tabs.ultimate-guitar.com/tab/invented-band/invented-song-chords-1234567?capo=0&transpose=0#top'
      )
    ).toBe('https://tabs.ultimate-guitar.com/tab/invented-band/invented-song-chords-1234567');
  });

  it('keeps text that only looks like a link', () => {
    expect(toSearchKeyword('https://')).toBe('https://');
  });
});
