import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PgDialect } from 'drizzle-orm/pg-core';

import { InvalidInputError } from '../cast';
import { SONG_CREDITS_MAX_LENGTH } from '../schema';
import { SongSearch, containsPattern, searchCondition, toSongValues } from './song.repository';

const NO_FILTERS: SongSearch = {
  keyword: '',
  code: '',
  letter: '',
  tempo: [],
  themes: [],
  keys: [],
  sortBy: 'title',
  descending: false,
  offset: 0,
  limit: 20,
};

const compile = (search: Partial<SongSearch>) => {
  const condition = searchCondition({ ...NO_FILTERS, ...search });
  assert.ok(condition);
  return new PgDialect().sqlToQuery(condition);
};

describe('searchCondition', () => {
  it('only filters out deleted songs when nothing else is asked for', () => {
    const { sql, params } = compile({});
    assert.equal(sql, '"songs"."is_deleted" = $1');
    assert.deepEqual(params, [false]);
  });

  it('matches the keyword against title, artist, and lyrics with the chords stripped', () => {
    const { sql, params } = compile({ keyword: '50%_off' });
    assert.match(sql, /"songs"."title" ilike \$2/);
    assert.match(sql, /"songs"."artist" ilike \$3/);
    assert.match(sql, /regexp_replace\("songs"."chord_lyrics", \$4, '', 'g'\) ilike \$5/);
    assert.deepEqual(params, [
      false,
      '%50\\%\\_off%',
      '%50\\%\\_off%',
      String.raw`\[[^\]]*\]`,
      '%50\\%\\_off%',
    ]);
  });

  it('keeps the keyword and code in one OR group', () => {
    const { sql } = compile({ keyword: 'love', code: 'A1' });
    assert.match(
      sql,
      /\(.*title.* ilike .* or .*artist.* or .*chord_lyrics.* or .*code.* ilike .*\)/
    );
  });

  it('filters by first letter as a parameter, allowing leading whitespace', () => {
    const { sql, params } = compile({ letter: 'B' });
    assert.match(sql, /"songs"."title" ~\* \$2/);
    assert.deepEqual(params, [false, String.raw`^\s*B`]);
  });

  it('filters titles not starting with A to Z for #', () => {
    const { sql, params } = compile({ letter: '#' });
    assert.match(sql, /"songs"."title" !~\* \$2/);
    assert.deepEqual(params, [false, String.raw`^\s*[a-z]`]);
  });
});

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

describe('toSongValues credits', () => {
  it('trims credits, stores empty as null, and leaves credits out when not sent', () => {
    assert.equal(
      toSongValues({ credits: '  Words 1779, music 1829.  ' }).credits,
      'Words 1779, music 1829.'
    );
    assert.equal(toSongValues({ credits: '   ' }).credits, null);
    assert.equal(toSongValues({ credits: null }).credits, null);
    assert.equal('credits' in toSongValues({ title: 'Song' }), false);
  });

  it('accepts the length limit and rejects more or a NUL character', () => {
    const atLimit = '你'.repeat(SONG_CREDITS_MAX_LENGTH);
    assert.equal(toSongValues({ credits: atLimit }).credits, atLimit);
    assert.throws(
      () => toSongValues({ credits: 'a'.repeat(SONG_CREDITS_MAX_LENGTH + 1) }),
      InvalidInputError
    );
    assert.throws(() => toSongValues({ credits: 'a\u0000b' }), InvalidInputError);
    assert.throws(() => toSongValues({ credits: ['a'] }), InvalidInputError);
  });
});
