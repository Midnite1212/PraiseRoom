import { describe, expect, it } from 'vitest';

import { conventionalKey } from '@/features/chords/key-spelling';
import { keyLabel } from '@/features/chords/theory';

import type { Song } from './api';
import {
  chordsOnWord,
  type DraftSection,
  diatonicChords,
  draftProblem,
  END_SLOT,
  firstChordKey,
  LEAD_SLOT,
  nextSectionLabel,
  parseLine,
  parseSections,
  placeChord,
  sameInput,
  serializeLine,
  serializeSections,
  slotsOf,
  toDraft,
  toSongInput,
  withAutoKey,
  wordsOf,
} from './song-draft';

const CHART = [
  '{Verse 1}',
  '[G]Amazing grace, how [C]sweet the [G]sound',
  'That saved a wretch like me',
  '',
  '{Chorus}',
  '[D]Praise [G]Him',
].join('\n');

const song: Song = {
  _id: '507f1f77bcf86cd799439021',
  urlKey: 'k3x9p2',
  title: 'Invented Song',
  artist: 'Invented Artist',
  originalKey: 'G',
  chordLyrics: CHART,
  capo: 2,
  year: '1999',
  code: 'N001',
  tempo: ['Slow'],
  timeSignature: ['4/4'],
  themes: ['Hope'],
  recommendedKeys: [],
};

const section = (label: string, ...lines: string[]): DraftSection => ({
  id: label,
  label,
  lines,
});

describe('parseSections and serializeSections', () => {
  it('round-trips a chart unchanged', () => {
    expect(serializeSections(parseSections(CHART))).toBe(CHART);
  });

  it('keeps blank lines inside a section and drops those at its edges', () => {
    const sections = parseSections('{Verse 1}\n\none\n\ntwo\n\n\n{Chorus}\nthree');
    expect(sections.map(({ label, lines }) => ({ label, lines }))).toEqual([
      { label: 'Verse 1', lines: ['one', '', 'two'] },
      { label: 'Chorus', lines: ['three'] },
    ]);
    expect(serializeSections(sections)).toBe('{Verse 1}\none\n\ntwo\n\n{Chorus}\nthree');
  });

  it('keeps text before the first header as an unnamed section without inventing a header', () => {
    const sections = parseSections('[G]Intro line\n{Verse 1}\nline');
    expect(sections[0]?.label).toBe('');
    expect(serializeSections(sections)).toBe('[G]Intro line\n\n{Verse 1}\nline');
  });

  it('keeps an empty section so a freshly added block survives a round trip', () => {
    expect(serializeSections(parseSections('{Verse 1}\nline\n\n{Chorus}'))).toBe(
      '{Verse 1}\nline\n\n{Chorus}'
    );
  });

  it('reads CRLF text and gives a blank label a numbered header after the first section', () => {
    expect(parseSections('{Verse 1}\r\none\r\n').map((entry) => entry.lines)).toEqual([['one']]);
    expect(serializeSections([section('Verse 1', 'a'), section(' ', 'b')])).toBe(
      '{Verse 1}\na\n\n{Section 2}\nb'
    );
  });

  it('strips braces from a label so it cannot break the header', () => {
    expect(serializeSections([section('Ve{r}se', 'a')])).toBe('{Verse}\na');
  });

  it('is empty when there are no sections', () => {
    expect(parseSections('')).toEqual([]);
    expect(serializeSections([])).toBe('');
  });
});

describe('lines and words', () => {
  it('splits a line into text and chord positions and puts them back', () => {
    const line = parseLine('[G]Amazing [C]grace');
    expect(line).toEqual({
      text: 'Amazing grace',
      chords: [
        { at: 0, name: 'G' },
        { at: 8, name: 'C' },
      ],
    });
    expect(serializeLine(line)).toBe('[G]Amazing [C]grace');
  });

  it('keeps two chords at one position in order', () => {
    expect(serializeLine(parseLine('[C][G]Oh'))).toBe('[C][G]Oh');
  });

  it('gives each word the chords from its start to the next word', () => {
    expect(wordsOf('Amazing  grace')).toEqual([
      { start: 0, text: 'Amazing', from: 0, to: 9 },
      { start: 9, text: 'grace', from: 9, to: Number.POSITIVE_INFINITY },
    ]);
  });
});

describe('placeChord', () => {
  it('puts a chord over a word', () => {
    expect(placeChord('Amazing grace', 8, 'C')).toBe('Amazing [C]grace');
  });

  it('replaces the chord a word already has, even one inside the word', () => {
    expect(placeChord('Ama[G]zing grace', 0, 'D')).toBe('[D]Amazing grace');
    expect(placeChord('[G]Amazing grace', 0, 'C/E')).toBe('[C/E]Amazing grace');
  });

  it('removes the chord with null and leaves other words alone', () => {
    expect(placeChord('[G]Amazing [C]grace', 0, null)).toBe('Amazing [C]grace');
  });

  it('ignores a position that is not the start of a word', () => {
    expect(placeChord('Amazing grace', 3, 'C')).toBe('Amazing grace');
  });
});

describe('diatonicChords', () => {
  it('spells the six chords of a key', () => {
    expect(diatonicChords(conventionalKey(7, false)).map(({ chord }) => chord)).toEqual([
      'G',
      'Am',
      'Bm',
      'C',
      'D',
      'Em',
    ]);
  });

  it('spells flat keys with flats and labels each chord with its numeral', () => {
    const palette = diatonicChords(conventionalKey(10, false));
    expect(palette.map(({ chord }) => chord)).toEqual(['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm']);
    expect(palette.map(({ numeral }) => numeral)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi']);
  });

  it('gives a minor key its relative major chords', () => {
    expect(diatonicChords(conventionalKey(4, true)).map(({ chord }) => chord)).toEqual([
      'G',
      'Am',
      'Bm',
      'C',
      'D',
      'Em',
    ]);
  });
});

describe('auto key', () => {
  it('reads the key from the first chord and skips cues', () => {
    const sections = [section('Verse 1', '[x2]Hey', 'Oh [D]Lord', '[G]Praise')];
    expect(keyLabel(firstChordKey(sections) ?? conventionalKey(0, false))).toBe('D');
  });

  it('names a minor key from a minor first chord', () => {
    expect(
      keyLabel(firstChordKey([section('Verse 1', '[Em7]Hold')]) ?? conventionalKey(0, false))
    ).toBe('Em');
  });

  it('is null when no line has a chord', () => {
    expect(firstChordKey([section('Verse 1', 'plain words')])).toBeNull();
  });

  it('moves the key only while the key is automatic', () => {
    const draft = toDraft(song);
    const sections = [section('Verse 1', '[A]Fresh')];
    expect(keyLabel(withAutoKey({ ...draft, keyAuto: true, sections }).key)).toBe('A');
    expect(keyLabel(withAutoKey({ ...draft, keyAuto: false, sections }).key)).toBe('G');
  });

  it('treats a song whose key matches its first chord as automatic', () => {
    expect(toDraft(song).keyAuto).toBe(true);
    expect(toDraft({ ...song, originalKey: 'D' }).keyAuto).toBe(false);
    expect(toDraft({ ...song, chordLyrics: '{Verse 1}\nplain', originalKey: 'D' }).keyAuto).toBe(
      true
    );
  });
});

describe('draft and song input', () => {
  it('rebuilds the saved song from an untouched draft, themes and code included', () => {
    expect(toSongInput(toDraft(song))).toEqual({
      title: 'Invented Song',
      artist: 'Invented Artist',
      originalKey: 'G',
      chordLyrics: CHART,
      tempo: ['Slow'],
      timeSignature: ['4/4'],
      themes: ['Hope'],
      code: 'N001',
      year: '1999',
      capo: 2,
      credits: null,
    });
  });

  it('sends trimmed credits and null for blank credits', () => {
    const draft = toDraft({ ...song, credits: 'Words 1779.' });
    expect(draft.credits).toBe('Words 1779.');
    expect(toSongInput({ ...draft, credits: '  Words 1779.\n' }).credits).toBe('Words 1779.');
    expect(toSongInput({ ...draft, credits: ' \n' }).credits).toBeNull();
    expect(toDraft(song).credits).toBe('');
  });

  it('sends Unknown for a blank artist and null for a blank code', () => {
    const input = toSongInput({ ...toDraft(song), artist: '  ', code: ' ' });
    expect(input.artist).toBe('Unknown');
    expect(input.code).toBeNull();
    expect(toDraft({ ...song, artist: 'Unknown' }).artist).toBe('');
  });

  it('reports what is missing before the server would refuse the song', () => {
    expect(draftProblem(toDraft(song))).toBeNull();
    expect(draftProblem({ ...toDraft(song), title: ' ' })).toBe('title');
    expect(draftProblem({ ...toDraft(song), sections: [] })).toBe('lyrics');
  });

  it('compares drafts by what they would send', () => {
    const draft = toDraft(song);
    expect(sameInput(draft, { ...draft, sections: parseSections(CHART) })).toBe(true);
    expect(sameInput(draft, { ...draft, title: 'Other' })).toBe(false);
  });
});

describe('nextSectionLabel', () => {
  it('numbers sections by type', () => {
    const none: DraftSection[] = [];
    expect(nextSectionLabel(none, 'Verse')).toBe('Verse 1');
    expect(nextSectionLabel(none, 'Chorus')).toBe('Chorus');
    expect(nextSectionLabel([section('Chorus')], 'Chorus')).toBe('Chorus 2');
    expect(nextSectionLabel([section('Verse 1'), section('Verse 2')], 'Verse')).toBe('Verse 3');
  });
});

describe('slotsOf', () => {
  it('adds a lead-in and an end slot around the words', () => {
    expect(slotsOf('Amazing grace')).toEqual([
      { start: LEAD_SLOT, text: '', from: 0, to: 0 },
      { start: 0, text: 'Amazing', from: 0, to: 8 },
      { start: 8, text: 'grace', from: 8, to: 13 },
      { start: END_SLOT, text: '', from: 13, to: Number.POSITIVE_INFINITY },
    ]);
  });

  it('gives a chord on a leading or trailing space to the slot, not a word', () => {
    const line = parseLine('[G] Amazing grace [C]');
    const chordsAt = (start: number) =>
      chordsOnWord(
        line,
        slotsOf(line.text).find((slot) => slot.start === start) ?? {
          start,
          text: '',
          from: 0,
          to: 0,
        }
      );

    expect(chordsAt(LEAD_SLOT)).toEqual(['G']);
    expect(chordsAt(1)).toEqual([]);
    expect(chordsAt(END_SLOT)).toEqual(['C']);
  });

  it('has no slots for a line without words', () => {
    expect(slotsOf('   ')).toEqual([]);
  });
});

describe('placeChord on the lead-in and end slots', () => {
  it('puts a chord before the line on a new leading space', () => {
    expect(placeChord('Amazing grace', LEAD_SLOT, 'G')).toBe('[G] Amazing grace');
  });

  it('keeps chords already in the line where they were when the leading space is added', () => {
    expect(placeChord('[C]Amazing [D]grace', LEAD_SLOT, 'G')).toBe('[G] [C]Amazing [D]grace');
  });

  it('reuses a leading space and replaces the lead-in chord', () => {
    expect(placeChord('[G] Amazing grace', LEAD_SLOT, 'D')).toBe('[D] Amazing grace');
  });

  it('puts a chord after the line on a new trailing space', () => {
    expect(placeChord('Amazing grace', END_SLOT, 'C')).toBe('Amazing grace [C]');
  });

  it('replaces the end chord and clears it with null', () => {
    expect(placeChord('Amazing grace [C]', END_SLOT, 'D')).toBe('Amazing grace [D]');
    expect(placeChord('Amazing grace [C]', END_SLOT, null)).toBe('Amazing grace ');
  });

  it('leaves the last word its own chord', () => {
    expect(placeChord('Amazing [G]grace [C]', 8, 'D')).toBe('Amazing [D]grace [C]');
  });
});
