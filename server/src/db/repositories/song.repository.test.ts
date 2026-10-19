import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { InvalidInputError } from '../cast';
import { containsPattern, toSongValues } from './song.repository';

describe('containsPattern', () => {
  it('wraps the text in wildcards, escaping LIKE wildcards and the escape character', () => {
    assert.equal(containsPattern('a.b*(1)'), '%a.b*(1)%');
    assert.equal(containsPattern('50%_off\\'), '%50\\%\\_off\\\\%');
  });
});

describe('toSongValues capo', () => {
  it('stores 1 to 11, treats 0 and empty as no capo, and leaves capo out when not sent', () => {
    assert.equal(toSongValues({ capo: 6 }).capo, 6);
    assert.equal(toSongValues({ capo: '2' }).capo, 2);
    assert.equal(toSongValues({ capo: 0 }).capo, null);
    assert.equal(toSongValues({ capo: null }).capo, null);
    assert.equal('capo' in toSongValues({ title: 'Song' }), false);
    assert.throws(() => toSongValues({ capo: 12 }), InvalidInputError);
  });

  it('casts the existing fields as before', () => {
    assert.deepEqual(toSongValues({ title: 'Song', year: 2020, tempo: ['Fast'] }), {
      title: 'Song',
      year: '2020',
      tempo: ['Fast'],
    });
  });
});
