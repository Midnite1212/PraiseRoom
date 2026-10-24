import type { ChordSegment } from '@/features/chords/parse';

export type WordPiece = { id: string; chord: string | null; text: string };
export type WordUnit = { id: string; pieces: WordPiece[] };

const CJK = '\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uAC00-\\uD7AF\\uF900-\\uFAFF';
const PIECE_PATTERN = new RegExp(`(?:[${CJK}]|[^\\s${CJK}]+)\\s*|\\s+`, 'gu');
const ENDS_IN_CJK = new RegExp(`[${CJK}]$`, 'u');
const STARTS_WITH_CJK = new RegExp(`^[${CJK}]`, 'u');
const STARTS_WITH_CLOSING = /^[　-〿＀-￯,.;:!?)'"”’]/u;

const endsWord = (piece: WordPiece, next: WordPiece | undefined) => {
  if (next === undefined || /\s$/u.test(piece.text)) return true;
  if (next.text === '' || STARTS_WITH_CLOSING.test(next.text)) return false;
  return ENDS_IN_CJK.test(piece.text) || STARTS_WITH_CJK.test(next.text);
};

// Splits a line's chord segments into words, so a chord inside a word keeps the whole word in one
// unit and the line can only wrap between units. Chinese and Japanese text breaks after each character.
export const groupWordUnits = (segments: readonly ChordSegment[]): WordUnit[] => {
  const pieces = segments.flatMap(({ id, chord, lyric }): WordPiece[] => {
    const texts = lyric === '' ? [''] : (lyric.match(PIECE_PATTERN) ?? [lyric]);
    return texts.map((text, index) => ({
      id: `${id}.${index}`,
      chord: index === 0 ? chord : null,
      text,
    }));
  });
  const units: WordUnit[] = [];
  let open: WordPiece[] = [];
  pieces.forEach((piece, index) => {
    open.push(piece);
    if (endsWord(piece, pieces[index + 1])) {
      units.push({ id: open[0]?.id ?? piece.id, pieces: open });
      open = [];
    }
  });
  return units;
};
