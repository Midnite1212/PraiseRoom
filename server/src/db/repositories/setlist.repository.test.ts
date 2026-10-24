import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { InvalidInputError } from '../cast';
import { SETLIST_SONG_NOTE_MAX_LENGTH } from '../schema';
import { castSongNotes } from './setlist.repository';

const SONG_A = '507f1f77bcf86cd799439031';
const SONG_B = '507f1f77bcf86cd799439032';

describe('castSongNotes', () => {
  it('trims notes, drops empty ones, and keeps the last note for a repeated song', () => {
    assert.deepEqual(
      castSongNotes([
        { songId: SONG_A, note: '  Acapella last chorus ' },
        { songId: SONG_B, note: '   ' },
        { songId: SONG_A, note: 'Key change' },
      ]),
      [{ songId: SONG_A, note: 'Key change' }]
    );
    assert.deepEqual(castSongNotes([]), []);
  });

  it('lowercases the song id like the other setlist ids', () => {
    assert.deepEqual(castSongNotes([{ songId: SONG_A.toUpperCase(), note: 'Hi' }]), [
      { songId: SONG_A, note: 'Hi' },
    ]);
  });

  it('accepts a note at the limit, counting characters rather than bytes', () => {
    const note = '你'.repeat(SETLIST_SONG_NOTE_MAX_LENGTH);
    assert.deepEqual(castSongNotes([{ songId: SONG_A, note }]), [{ songId: SONG_A, note }]);
  });

  it('rejects anything that is not a list of song ids with text notes', () => {
    const tooLong = 'a'.repeat(SETLIST_SONG_NOTE_MAX_LENGTH + 1);
    for (const value of [
      null,
      undefined,
      'note',
      {},
      [null],
      ['note'],
      [{ songId: 'bad', note: 'x' }],
      [{ note: 'x' }],
      [{ songId: SONG_A, note: { text: 'x' } }],
      [{ songId: SONG_A, note: ['x'] }],
      [{ songId: SONG_A, note: 'a\u0000b' }],
      [{ songId: SONG_A, note: tooLong }],
    ]) {
      assert.throws(() => castSongNotes(value), InvalidInputError, JSON.stringify(value));
    }
  });
});
