import guitarJson from '@tombatossals/chords-db/lib/guitar.json?raw';
import { describe, expect, it } from 'vitest';

import { buildChordShapeDb, findChordShapes } from '@/features/chords/chord-shapes';

import { BROWSE_CHORDS, LIBRARY_QUALITIES, searchChords } from './chord-search';

describe('searchChords', () => {
  it('lists the major and minor chords of every root for an empty search', () => {
    expect(searchChords('  ')).toEqual([...BROWSE_CHORDS]);
    expect(BROWSE_CHORDS).toHaveLength(24);
    expect(BROWSE_CHORDS.slice(0, 4)).toEqual(['C', 'Cm', 'Db', 'C#m']);
  });

  it('lists every chord on a root, the major first', () => {
    const chords = searchChords('G');
    expect(chords).toHaveLength(LIBRARY_QUALITIES.length);
    expect(chords.slice(0, 5)).toEqual(['G', 'Gm', 'G7', 'Gm7', 'Gmaj7']);
  });

  it('narrows by the quality typed so far, the exact chord first', () => {
    expect(searchChords('F#m7')).toEqual(['F#m7', 'F#m7b5']);
    expect(searchChords('Csus')).toEqual(['Csus4', 'Csus2']);
    expect(searchChords('A7').slice(0, 2)).toEqual(['A7', 'A7sus4']);
  });

  it('keeps the spelling typed and reads lowercase, spaces and music accidentals', () => {
    expect(searchChords('bb')[0]).toBe('Bb');
    expect(searchChords('a#')[0]).toBe('A#');
    expect(searchChords(' e m7 ')[0]).toBe('Em7');
    expect(searchChords('B♭maj7')).toEqual(['Bbmaj7', 'Bbmaj7b5', 'Bbmaj7#5']);
  });

  it('reads other ways to write a quality', () => {
    expect(searchChords('Cmin7')).toEqual(['Cm7']);
    expect(searchChords('CM7')).toEqual(['Cmaj7']);
    expect(searchChords('D2')).toEqual(['Dsus2']);
  });

  it('lists a bare quality on every root, spelled the usual way', () => {
    const chords = searchChords('sus4');
    expect(chords).toHaveLength(12);
    expect(chords.slice(0, 3)).toEqual(['Csus4', 'Dbsus4', 'Dsus4']);
    expect(searchChords('m7').slice(0, 2)).toEqual(['Cm7', 'C#m7']);
  });

  it('reads a quality that starts with a note letter', () => {
    expect(searchChords('dim').slice(0, 2)).toEqual(['Cdim', 'Dbdim']);
    expect(searchChords('add9')[0]).toBe('Cadd9');
    expect(searchChords('aug')[0]).toBe('Caug');
  });

  it('returns any other readable chord as typed', () => {
    expect(searchChords('d/f#')).toEqual(['D/F#']);
    expect(searchChords('C5')).toEqual(['C5']);
  });

  it('finds nothing for text that is not a chord', () => {
    expect(searchChords('hello')).toEqual([]);
    expect(searchChords('x2')).toEqual([]);
  });
});

describe('the chord library', () => {
  it('has a shape in the real dataset for every chord it lists', () => {
    const db = buildChordShapeDb(JSON.parse(guitarJson));
    const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const listed = [...BROWSE_CHORDS, ...roots.flatMap((root) => searchChords(root))];
    expect(listed).toHaveLength(24 + 12 * LIBRARY_QUALITIES.length);
    expect(listed.filter((chord) => findChordShapes(db, chord).length === 0)).toEqual([]);
  });
});
