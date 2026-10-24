import { conventionalKey } from '@/features/chords/key-spelling';
import {
  isMinorQuality,
  keyLabel,
  type MusicKey,
  noteName,
  parseChord,
} from '@/features/chords/theory';

import type { Song, SongInput } from './api';
import { initialKey } from './key-options';

export const UNKNOWN_ARTIST = 'Unknown';

export const SECTION_TYPES = ['Verse', 'Chorus', 'Bridge', 'Tag'] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export type DraftSection = { id: string; label: string; lines: string[] };

export type SongDraft = {
  title: string;
  artist: string;
  key: MusicKey;
  keyAuto: boolean;
  tempo: string[];
  timeSignature: string[];
  themes: string[];
  code: string;
  year: string | null;
  capo: number | null;
  sections: DraftSection[];
};

export type LineChord = { at: number; name: string };

export type ParsedLine = { text: string; chords: LineChord[] };

export type Word = { start: number; text: string; from: number; to: number };

const SECTION_HEADER = /^\s*\{([^{}]*)\}\s*$/;
const CHORD_TOKEN = /(\[[^\]]*\])/;
const CHORD_TOKEN_EXACT = /^\[([^\]]*)\]$/;

const isBlank = (line: string) => line.trim() === '';

const trimBlankEdges = (lines: readonly string[]): string[] => {
  let start = 0;
  let end = lines.length;
  while (start < end && isBlank(lines[start] ?? '')) start++;
  while (end > start && isBlank(lines[end - 1] ?? '')) end--;
  return lines.slice(start, end);
};

// `{Verse 1}` on its own line starts a section; the lines under it, blank lines inside included, belong to it.
// Text before the first header becomes an unnamed section. Empty sections are kept so a new block survives.
export const parseSections = (chordLyrics: string): DraftSection[] => {
  const sections: DraftSection[] = [];
  let current: { label: string; lines: string[] } = { label: '', lines: [] };
  const close = () => {
    const lines = trimBlankEdges(current.lines);
    if (current.label !== '' || lines.length > 0) {
      sections.push({ id: `section-${sections.length}`, label: current.label, lines });
    }
  };
  for (const rawLine of chordLyrics.replace(/\r\n?/g, '\n').split('\n')) {
    const header = SECTION_HEADER.exec(rawLine);
    if (header) {
      close();
      current = { label: header[1]?.trim() ?? '', lines: [] };
    } else {
      current.lines.push(rawLine);
    }
  }
  close();
  return sections;
};

const cleanLabel = (label: string) => label.replace(/[{}]/g, '').trim();

// The stored ChordPro text: `{Label}` then the lines, sections separated by one blank line.
export const serializeSections = (sections: readonly DraftSection[]): string =>
  sections
    .map((section, index) => {
      const label = cleanLabel(section.label) || (index === 0 ? '' : `Section ${index + 1}`);
      const body = trimBlankEdges(section.lines).join('\n');
      return [label ? `{${label}}` : '', body].filter((part) => part !== '').join('\n');
    })
    .filter((block) => block !== '')
    .join('\n\n');

// A ChordPro line as its plain text plus each chord's character position, so a chord can move with its word.
export const parseLine = (raw: string): ParsedLine => {
  const chords: LineChord[] = [];
  let text = '';
  for (const part of raw.split(CHORD_TOKEN)) {
    const chord = CHORD_TOKEN_EXACT.exec(part);
    if (chord) chords.push({ at: text.length, name: chord[1] ?? '' });
    else text += part;
  }
  return { text, chords };
};

export const serializeLine = ({ text, chords }: ParsedLine): string => {
  let out = '';
  let cursor = 0;
  for (const chord of chords.toSorted((a, b) => a.at - b.at)) {
    out += `${text.slice(cursor, chord.at)}[${chord.name}]`;
    cursor = Math.max(cursor, chord.at);
  }
  return out + text.slice(cursor);
};

// Each word owns the chords from its own start up to the next word's start; the first word also owns any before it.
export const wordsOf = (text: string): Word[] => {
  const found = Array.from(text.matchAll(/\S+/g), (match) => ({
    start: match.index,
    text: match[0],
  }));
  return found.map(({ start, text: word }, index) => ({
    start,
    text: word,
    from: index === 0 ? 0 : start,
    to: found[index + 1]?.start ?? Number.POSITIVE_INFINITY,
  }));
};

export const chordsOnWord = (line: ParsedLine, word: Word): string[] =>
  line.chords.filter(({ at }) => at >= word.from && at < word.to).map(({ name }) => name);

// Puts `name` over the word that starts at `wordStart`, replacing whatever chord it had; null clears it.
export const placeChord = (raw: string, wordStart: number, name: string | null): string => {
  const line = parseLine(raw);
  const word = wordsOf(line.text).find((candidate) => candidate.start === wordStart);
  if (!word) return raw;
  const chords = line.chords.filter(({ at }) => at < word.from || at >= word.to);
  if (name !== null && name.trim() !== '') chords.push({ at: word.start, name: name.trim() });
  return serializeLine({ text: line.text, chords });
};

const PALETTE = [
  { offset: 0, quality: '', numeral: 'I' },
  { offset: 2, quality: 'm', numeral: 'ii' },
  { offset: 4, quality: 'm', numeral: 'iii' },
  { offset: 5, quality: '', numeral: 'IV' },
  { offset: 7, quality: '', numeral: 'V' },
  { offset: 9, quality: 'm', numeral: 'vi' },
] as const;

// The six chords that live in a key (I ii iii IV V vi), spelt the way the key spells them. A minor key
// uses its relative major's chords, which are the same six.
export const diatonicChords = (key: MusicKey): { chord: string; numeral: string }[] => {
  const tonic = key.isMinor ? (key.root + 3) % 12 : key.root;
  const useFlats = key.isMinor ? conventionalKey(tonic, false).prefersFlats : key.prefersFlats;
  return PALETTE.map(({ offset, quality, numeral }) => ({
    chord: `${noteName(tonic + offset, useFlats)}${quality}`,
    numeral,
  }));
};

export const sameKey = (a: MusicKey, b: MusicKey) => a.root === b.root && a.isMinor === b.isMinor;

// The key the song's first readable chord names; cues such as `[x2]` are skipped.
export const firstChordKey = (sections: readonly DraftSection[]): MusicKey | null => {
  for (const section of sections) {
    for (const line of section.lines) {
      for (const { name } of parseLine(line).chords) {
        const parsed = parseChord(name);
        if (parsed) return conventionalKey(parsed.root, isMinorQuality(parsed.quality));
      }
    }
  }
  return null;
};

// While the key is automatic it follows the first chord.
export const withAutoKey = (draft: SongDraft): SongDraft => {
  if (!draft.keyAuto) return draft;
  const key = firstChordKey(draft.sections);
  return key === null || sameKey(key, draft.key) ? draft : { ...draft, key };
};

export const toDraft = (song: Song): SongDraft => {
  const sections = parseSections(song.chordLyrics);
  const key = initialKey(song.originalKey);
  const chordKey = firstChordKey(sections);
  return {
    title: song.title,
    artist: song.artist === UNKNOWN_ARTIST ? '' : song.artist,
    key,
    keyAuto: chordKey === null || sameKey(chordKey, key),
    tempo: song.tempo,
    timeSignature: song.timeSignature,
    themes: song.themes,
    code: song.code ?? '',
    year: song.year ?? null,
    capo: song.capo ?? null,
    sections,
  };
};

export const toSongInput = (draft: SongDraft): SongInput => ({
  title: draft.title.trim(),
  artist: draft.artist.trim() || UNKNOWN_ARTIST,
  originalKey: keyLabel(draft.key),
  chordLyrics: serializeSections(draft.sections),
  tempo: draft.tempo,
  timeSignature: draft.timeSignature,
  themes: draft.themes,
  code: draft.code.trim() || null,
  year: draft.year,
  capo: draft.capo,
});

// What the server needs before it accepts the song: a title and some lyrics.
export const draftProblem = (draft: SongDraft): 'title' | 'lyrics' | null => {
  if (draft.title.trim() === '') return 'title';
  if (serializeSections(draft.sections) === '') return 'lyrics';
  return null;
};

export const sameInput = (a: SongDraft, b: SongDraft): boolean =>
  a === b || JSON.stringify(toSongInput(a)) === JSON.stringify(toSongInput(b));

// "Verse 1", "Chorus", then "Chorus 2": the first of a type is bare except Verse.
export const nextSectionLabel = (sections: readonly DraftSection[], type: SectionType): string => {
  const count = sections.filter((section) => section.label.startsWith(type)).length;
  if (count > 0) return `${type} ${count + 1}`;
  return type === 'Verse' ? 'Verse 1' : type;
};
