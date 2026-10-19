import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  artistsMatch,
  earliestItunesYear,
  findSongBpmLink,
  parseSongBpmPage,
  tempoBand,
} from './metadata';

describe('tempoBand', () => {
  it('maps BPM to the app tempo options', () => {
    assert.equal(tempoBand(66), 'Slow');
    assert.equal(tempoBand(78), 'Medium Slow');
    assert.equal(tempoBand(96), 'Medium');
    assert.equal(tempoBand(128), 'Fast');
  });
});

describe('songbpm', () => {
  it('reads tempo, key, and beats per bar', () => {
    const html =
      '<p>Morning Light by Invented Band has a tempo of 72 BPM.</p><p>It runs 4 minutes long with a B key and a major mode. It has a time signature of 4 beats per bar.</p>';
    assert.deepEqual(parseSongBpmPage(html), { bpm: 72, recordingKey: 'B', timeSignature: '4/4' });
  });

  it('maps minor keys and leaves unusual meters unset', () => {
    const html =
      'tempo of 140 BPM with a G#/Ab key and a minor mode, time signature of 5 beats per bar';
    assert.deepEqual(parseSongBpmPage(html), {
      bpm: 140,
      recordingKey: 'G#m',
      timeSignature: null,
    });
  });

  it('only follows a search result by the same artist and title', () => {
    const html = [
      '<a href="/@other-artist/morning-light-ab12">',
      '<a href="/@invented-band/morning-light-reprise-cd34">',
      '<a href="/@invented-band/morning-light-ef56">',
    ].join('');
    assert.equal(
      findSongBpmLink(html, 'Morning Light', 'Invented Band'),
      'https://songbpm.com/@invented-band/morning-light-ef56'
    );
  });
});

describe('iTunes', () => {
  it('returns the earliest release year by a matching artist and title', () => {
    const json = JSON.stringify({
      results: [
        {
          trackName: 'Morning Light (Live)',
          artistName: 'Invented Band',
          releaseDate: '2019-01-01T00:00:00Z',
        },
        {
          trackName: 'Morning Light',
          artistName: 'Invented Band',
          releaseDate: '2016-05-01T00:00:00Z',
        },
        {
          trackName: 'Morning Light',
          artistName: 'Cover Act',
          releaseDate: '2010-01-01T00:00:00Z',
        },
      ],
    });
    assert.equal(earliestItunesYear(json, 'Morning Light', 'Invented Band'), '2016');
    assert.equal(earliestItunesYear('not json', 'Morning Light', 'Invented Band'), null);
  });

  it('matches artist names loosely', () => {
    assert.ok(artistsMatch('Hillsong UNITED', 'Hillsong United'));
    assert.ok(artistsMatch('Invented Band feat. Someone', 'Invented Band'));
    assert.ok(!artistsMatch('Invented Band', 'Other Group'));
  });
});
