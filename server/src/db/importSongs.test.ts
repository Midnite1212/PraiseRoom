import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvalidInputError } from './cast';
import { mapSongDocuments, objectIdDate, parseDate, parseObjectId, toSongRow } from './importSongs';

const ID = '64b0000000000000000000a1';

const exported = (fields: Record<string, unknown> = {}): Record<string, unknown> => ({
  _id: { $oid: ID },
  artist: 'Artist',
  chordLyrics: '[C]La',
  originalKey: 'C',
  title: 'Title',
  ...fields,
});

describe('parseObjectId', () => {
  it('reads $oid wrappers and plain strings, lowercased', () => {
    assert.equal(parseObjectId({ $oid: ID.toUpperCase() }), ID);
    assert.equal(parseObjectId(ID), ID);
  });

  it('rejects anything that is not 24 hex characters', () => {
    for (const value of [undefined, null, 'abc', { $oid: 'zz'.repeat(12) }, 42]) {
      assert.equal(parseObjectId(value), null);
    }
  });
});

describe('parseDate', () => {
  it('reads relaxed ISO dates, canonical $numberLong dates, and plain values', () => {
    const iso = '2024-05-06T07:08:09.010Z';
    const expected = new Date(iso).getTime();
    assert.equal(parseDate({ $date: iso })?.getTime(), expected);
    assert.equal(parseDate({ $date: { $numberLong: String(expected) } })?.getTime(), expected);
    assert.equal(parseDate(iso)?.getTime(), expected);
  });

  it('returns null for missing or invalid dates', () => {
    for (const value of [undefined, null, { $date: 'not a date' }, { $date: {} }, true]) {
      assert.equal(parseDate(value), null);
    }
  });
});

describe('toSongRow', () => {
  it('maps every column and defaults absent optional fields', () => {
    assert.deepEqual(toSongRow(exported()), {
      id: ID,
      title: 'Title',
      artist: 'Artist',
      originalKey: 'C',
      chordLyrics: '[C]La',
      tempo: [],
      recommendedKeys: [],
      themes: [],
      timeSignature: [],
      year: null,
      code: null,
      simplifiedChordLyrics: null,
      createdBy: null,
      lastUpdatedBy: null,
      isVerified: false,
      isDeleted: false,
      createdAt: objectIdDate(ID),
      updatedAt: objectIdDate(ID),
    });
  });

  it('keeps present values, ownership ids, flags, and timestamps', () => {
    const row = toSongRow(
      exported({
        __v: 0,
        code: 'A1',
        createdAt: { $date: '2024-01-01T00:00:00Z' },
        createdBy: { $oid: 'AB'.repeat(12) },
        isDeleted: true,
        isVerified: true,
        lastUpdatedBy: { $oid: 'cd'.repeat(12) },
        recommendedKeys: ['C', 'D'],
        simplifiedChordLyrics: 'La',
        tempo: ['Fast', 3],
        themes: ['Hope'],
        timeSignature: ['4/4'],
        updatedAt: { $date: { $numberLong: '1717200000000' } },
        year: '2019',
      })
    );
    assert.deepEqual(row.tempo, ['Fast', '3']);
    assert.deepEqual([row.code, row.year, row.simplifiedChordLyrics], ['A1', '2019', 'La']);
    assert.deepEqual([row.createdBy, row.lastUpdatedBy], ['ab'.repeat(12), 'cd'.repeat(12)]);
    assert.deepEqual([row.isDeleted, row.isVerified], [true, true]);
    assert.equal(row.createdAt?.toISOString(), '2024-01-01T00:00:00.000Z');
    assert.equal(row.updatedAt?.getTime(), 1717200000000);
    assert.equal('__v' in row, false);
  });

  it('casts numbers to text and single values to arrays, like the API', () => {
    const row = toSongRow(exported({ year: 2019, code: 101, tempo: 'Fast', themes: 'Hope' }));
    assert.deepEqual(
      [row.year, row.code, row.tempo, row.themes],
      ['2019', '101', ['Fast'], ['Hope']]
    );
  });

  it('falls back to createdAt for a missing updatedAt', () => {
    const row = toSongRow(exported({ createdAt: { $date: '2024-01-01T00:00:00Z' } }));
    assert.equal(row?.updatedAt?.toISOString(), '2024-01-01T00:00:00.000Z');
  });

  it('rejects a bad id, a missing required field, an uncastable value, or a NUL character', () => {
    const rejects = (document: unknown, path: string) =>
      assert.throws(
        () => toSongRow(document),
        (error: unknown) => error instanceof InvalidInputError && error.path === path,
        path
      );
    rejects(exported({ _id: { $oid: 'nope' } }), '_id');
    for (const field of ['title', 'artist', 'originalKey', 'chordLyrics']) {
      rejects(exported({ [field]: undefined }), field);
      rejects(exported({ [field]: '' }), field);
    }
    rejects(exported({ tempo: [{ bpm: 120 }] }), 'tempo');
    rejects(exported({ chordLyrics: 'pasted\u0000text' }), 'chordLyrics');
    rejects('not a document', 'document');
  });
});

describe('mapSongDocuments', () => {
  it('reports invalid and duplicate documents by index, id, and reason', () => {
    const other = '64b0000000000000000000a2';
    const { rows, skipped } = mapSongDocuments([
      exported(),
      exported({ title: '' }),
      exported({ _id: { $oid: other } }),
      exported({ _id: { $oid: ID.toUpperCase() } }),
      exported({ _id: 'bad' }),
      null,
    ]);
    assert.deepEqual(
      rows.map((row) => row.id),
      [ID, other]
    );
    assert.deepEqual(skipped, [
      { index: 1, id: ID, reason: 'invalid title' },
      { index: 3, id: ID, reason: 'duplicate id' },
      { index: 4, id: null, reason: 'invalid _id' },
      { index: 5, id: null, reason: 'invalid document' },
    ]);
  });
});
