import { isChord } from './theory';

const fromCodePoint = (code: number): string =>
  code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff)
    ? String.fromCodePoint(code)
    : '';

export const decodeEntities = (text: string): string =>
  text
    .replace(/&#xD;/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d{1,7});/g, (_, code: string) => fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, code: string) => fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&');

const SECTION_NAMES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^pre[\s-]?chorus/i, 'Prechorus'],
  [/^post[\s-]?chorus/i, 'Post-Chorus'],
  [/^(verse|stanza)/i, 'Verse'],
  [/^(chorus|refrain)/i, 'Chorus'],
  [/^bridge/i, 'Bridge'],
  [/^tag/i, 'Tag'],
  [/^intro/i, 'Intro'],
  [/^(outro|ending|end\b)/i, 'Outro'],
  [/^instrumental/i, 'Instrumental'],
  [/^interlude/i, 'Interlude'],
  [/^turnaround/i, 'Turnaround'],
  [/^vamp/i, 'Vamp'],
  [/^break(down)?/i, 'Break'],
];

// "Verse1", "[Pre-Chorus 2]", "CHORUS:" → "Verse 1", "Prechorus 2", "Chorus"; null when the text isn't a section name.
export const sectionLabel = (raw: string): string | null => {
  const text = raw.replace(/[:[\]{}()]/g, '').trim();
  if (text.length > 24) return null;
  for (const [pattern, name] of SECTION_NAMES) {
    const match = pattern.exec(text);
    if (!match) continue;
    const rest = text.slice(match[0].length).trim();
    if (rest && !/^\d+$/.test(rest) && !/^(x\s*\d+|\d+\s*x)$/i.test(rest)) return null;
    const number = /^\d+$/.test(rest) ? ` ${rest}` : '';
    return `${name}${number}`;
  }
  return null;
};

const HEADER = /^\s*\{([^{}]*)\}\s*$/;

const numberRepeatedVerses = (lines: string[]): string[] => {
  const plain = lines.filter((line) => line === '{Verse}').length;
  if (plain < 2 || lines.some((line) => /^\{Verse \d+\}$/.test(line))) return lines;
  let verse = 0;
  return lines.map((line) => (line === '{Verse}' ? `{Verse ${++verse}}` : line));
};

// One blank line before each header, none after it, no runs of blank lines.
export const tidy = (text: string): string => {
  const lines = numberRepeatedVerses(
    text
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
  );
  const out: string[] = [];
  for (const line of lines) {
    const previous = out[out.length - 1];
    if (line === '' && (previous === undefined || previous === '' || HEADER.test(previous)))
      continue;
    if (HEADER.test(line) && previous !== undefined && previous !== '') out.push('');
    out.push(line);
  }
  while (out[out.length - 1] === '') out.pop();
  return out.join('\n');
};

const CHORD_LINE_NOISE = /^(\||-+|x\d+|\d+x|\(|\)|\/|\.|n\.?c\.?)$/i;

// A line made only of chords (plus bar lines, "x2", "N.C."), with at least one real chord.
export const isChordLine = (line: string): boolean => {
  const tokens = line.replace(/[()|]/g, ' ').trim().split(/\s+/).filter(Boolean);
  return (
    tokens.some(isChord) && tokens.every((token) => isChord(token) || CHORD_LINE_NOISE.test(token))
  );
};

const chordsWithColumns = (line: string) =>
  [...line.matchAll(/\S+/g)]
    .filter((match) => isChord(match[0]))
    .map((match) => ({ column: match.index, chord: match[0] }));

// East Asian wide characters take two columns in a monospaced chord-over-lyric chart.
const isWide = (codePoint: number): boolean =>
  (codePoint >= 0x1100 && codePoint <= 0x115f) ||
  (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
  (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
  (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
  (codePoint >= 0xfe30 && codePoint <= 0xfe4f) ||
  (codePoint >= 0xff00 && codePoint <= 0xff60) ||
  (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
  (codePoint >= 0x20000 && codePoint <= 0x3fffd);

// Each chord lands on the first character at or after its column; chords before the first word
// attach to it, and chords past the end of the lyric are padded out to their column.
const mergeChordsIntoLyric = (chordLine: string, lyric: string): string => {
  const chords = chordsWithColumns(chordLine);
  let column = lyric.length - lyric.trimStart().length;
  let next = 0;
  let merged = '';
  for (const character of lyric.trimStart()) {
    while (next < chords.length && (chords[next]?.column ?? 0) <= column) {
      merged += `[${chords[next]?.chord ?? ''}]`;
      next++;
    }
    merged += character;
    column += isWide(character.codePointAt(0) ?? 0) ? 2 : 1;
  }
  for (const { column: chordColumn, chord } of chords.slice(next)) {
    merged += `${' '.repeat(Math.max(0, chordColumn - column))}[${chord}]`;
    column = Math.max(column, chordColumn);
  }
  return merged;
};

const chordOnlyLine = (line: string): string =>
  line
    .replace(/\|/g, ' ')
    .trim()
    .replace(/\S+/g, (token) => (isChord(token) ? `[${token}]` : token));

const META_LINE =
  /^\s*(song|artist|album|title|key|tempo|bpm|capo|tuning|time signature|ccli|written by|writers?|chords? used)\s*[:#]/i;
const CREDIT_LINE =
  /(tabbed|transcribed|submitted|arranged|chords?) by\b|ultimate-guitar|https?:\/\/|www\./i;
const TAB_STAFF = /^\s*[eBGDAE]\s*\|[-\d|hpbr/\\~x ]+/;

const headerFor = (line: string): string | null => {
  const bracketed = /^\s*\[([^\]]+)\](?:\s*:)?\s*$/.exec(line);
  if (bracketed && !isChord((bracketed[1] ?? '').trim())) {
    return sectionLabel(bracketed[1] ?? '') ?? (bracketed[1] ?? '').trim();
  }
  const braced = /^\s*\{\s*(?:c|comment|ci|comment_italic)\s*:\s*([^}]*)\}\s*$/i.exec(line);
  if (braced) return sectionLabel(braced[1] ?? '') ?? (braced[1] ?? '').trim();
  if (/^\s*\{\s*(soc|start_of_chorus)\s*\}\s*$/i.test(line)) return 'Chorus';
  const ours = HEADER.exec(line);
  if (ours) return (ours[1] ?? '').trim();
  return sectionLabel(line);
};

const MAX_LINE_LENGTH = 300;

// Converts a chart in chords-over-lyrics layout, ChordPro, or our own inline format into our format.
export const toChordLyrics = (text: string): string => {
  const raw = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\t/g, '    ').slice(0, MAX_LINE_LENGTH));
  const out: string[] = [];
  for (let index = 0; index < raw.length; index++) {
    const line = raw[index] ?? '';
    if (TAB_STAFF.test(line)) continue;
    if (
      /^\s*\{\s*(eoc|end_of_chorus|t|title|st|subtitle|artist|key|tempo|time|capo)\b/i.test(line)
    ) {
      continue;
    }
    const header = headerFor(line);
    if (header !== null) {
      out.push('', `{${header}}`);
      continue;
    }
    if (isChordLine(line)) {
      const next = raw[index + 1];
      if (
        next !== undefined &&
        next.trim() !== '' &&
        !isChordLine(next) &&
        headerFor(next) === null
      ) {
        out.push(mergeChordsIntoLyric(line, next));
        index++;
      } else {
        out.push(chordOnlyLine(line));
      }
      continue;
    }
    out.push(line.trimEnd());
  }
  return tidy(out.join('\n'));
};

const SECTION_REFERENCE =
  /^(?:the\s+)?(chorus|refrain|bridge|verse|pre[\s-]?chorus|post[\s-]?chorus|tag|intro|outro|interlude|instrumental|turnaround|vamp)\s*(\d+)?\s*(?:x\s*\d+|\d+\s*x|twice)?$/i;
const PERFORMANCE_CUES =
  /\b(down|freely|as desired|full on|building|softly|quietly|all[- ]in|big|loud)\b/gi;

// "Repeat Chorus 2x" / "(Repeat Pre-Chorus & Chorus)" / "Chorus x2" → section names; null when the line is lyric text.
const repeatTargets = (line: string): string[] | null => {
  const plain = line.replace(/\[[^\]]*\]/g, '').trim();
  const directive = /^\(?\s*(?:repeat|rpt)\b\.?/i.test(plain);
  const bareTimes =
    /^\(?\s*(chorus|refrain|bridge|verse|pre[\s-]?chorus|tag)\s*\d*\s*(x\s*\d+|\d+\s*x|twice)\s*\)?$/i.test(
      plain
    );
  if (!directive && !bareTimes) return null;
  const rest = plain
    .replace(/^\(?\s*(?:repeat|rpt)\b\.?\s*/i, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(PERFORMANCE_CUES, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[:.]+$/, '')
    .trim();
  if (!rest) return [];
  const references = rest
    .split(/\s*(?:&|\band\b|,|\+)\s*/i)
    .map((part) => SECTION_REFERENCE.exec(part.trim()));
  if (references.every((reference) => reference === null)) {
    return /^(as necessary|until the end|chord pattern|x\s*\d+|\d+\s*x)$/i.test(rest) ? [] : null;
  }
  return references.flatMap((reference) => {
    if (!reference) return [];
    const label = sectionLabel(`${reference[1] ?? ''}${reference[2] ? ` ${reference[2]}` : ''}`);
    return label ? [label] : [];
  });
};

const withoutNumber = (label: string): string => label.replace(/\s*\d+$/, '');

// Strips chart-site residue and expands "Repeat Chorus" directives into a copy of the named section.
export const cleanChart = (chart: string): string => {
  const sections = new Map<string, string[]>();
  const out: string[] = [];
  let label: string | null = null;
  let body: string[] = [];

  const closeSection = () => {
    if (label === null || !body.some((line) => line.trim())) return;
    const lines = [...body];
    while (lines.length && !(lines[lines.length - 1] ?? '').trim()) lines.pop();
    const canonical = sectionLabel(label) ?? label;
    for (const key of [label, canonical, withoutNumber(label), withoutNumber(canonical)]) {
      sections.set(key, lines);
    }
  };

  for (const line of chart.split('\n')) {
    if (META_LINE.test(line) || CREDIT_LINE.test(line.replace(/\[[^\]]*\]/g, ''))) continue;
    const header = HEADER.exec(line);
    if (header) {
      closeSection();
      label = (header[1] ?? '').trim();
      body = [];
      out.push(line);
      continue;
    }
    const targets = repeatTargets(line);
    if (targets) {
      closeSection();
      label = null;
      for (const target of targets) {
        const lines = sections.get(target) ?? sections.get(withoutNumber(target));
        if (lines) out.push('', `{${target}}`, ...lines, '');
      }
      continue;
    }
    const tightened = line.replace(/^((?:\[[^\]]+\])+)\s+(?=[^\s[])/, '$1');
    body.push(tightened);
    out.push(tightened);
  }
  closeSection();

  const tidied = tidy(out.join('\n')).split('\n');
  const nonEmptySections = tidied.filter((line, index) => {
    if (!HEADER.test(line)) return true;
    const next = tidied.slice(index + 1).find((candidate) => candidate.trim() !== '');
    return next !== undefined && !HEADER.test(next);
  });
  return tidy(nonEmptySections.join('\n'));
};
