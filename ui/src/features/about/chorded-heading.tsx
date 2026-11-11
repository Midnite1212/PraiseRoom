import { Fragment } from 'react';

import { classifyChord } from '@/features/chords/chord-class';
import { parseKey } from '@/features/chords/theory';
import { CHORD_CLASS_COLOURS } from '@/features/reader/lyrics-sheet';
import { cn } from '@/lib/utils';

import { parseMarks } from './marked-text';

const HAN = '\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF';
const TOKEN_PATTERN = new RegExp(`[${HAN}]|[^\\s${HAN}]+|\\s+`, 'gu');
const HAS_LETTER = /[\p{L}\p{N}]/u;

const STAGGER = ['[--i:0]', '[--i:1]', '[--i:2]', '[--i:3]', '[--i:4]', '[--i:5]'] as const;

type Token = { id: number; text: string; accent: boolean; isUnit: boolean };

const tokenize = (text: string): Token[] =>
  parseMarks(text).flatMap((mark) =>
    [...mark.text.matchAll(TOKEN_PATTERN)].map((match) => ({
      id: mark.offset + match.index,
      text: match[0],
      accent: mark.kind === 'accent',
      isUnit: HAS_LETTER.test(match[0]),
    }))
  );

// Spreads `chords` over the heading's words (or Chinese characters), first and last included.
const pickUnits = (tokens: readonly Token[], count: number): Map<number, number> => {
  const units = tokens.filter((token) => token.isUnit);
  const total = Math.min(count, units.length);
  const picks = new Map<number, number>();
  for (let index = 0; index < total; index++) {
    const unit = units[total === 1 ? 0 : Math.round((index * (units.length - 1)) / (total - 1))];
    if (unit) picks.set(unit.id, index);
  }
  return picks;
};

type ChordedHeadingProps = {
  as?: 'h1' | 'h2' | 'h3' | 'p';
  id?: string;
  text: string;
  chords: readonly string[];
  musicKey: string;
  motion?: 'scroll' | 'load';
  className?: string;
};

export function ChordedHeading({
  as: Tag = 'h2',
  id,
  text,
  chords,
  musicKey,
  motion = 'scroll',
  className,
}: ChordedHeadingProps) {
  const key = parseKey(musicKey);
  const tokens = tokenize(text);
  const picks = pickUnits(tokens, chords.length);

  return (
    <Tag id={id} className={cn('pt-[0.3em] text-balance', className)}>
      {tokens.map((token) => {
        const content = token.accent ? (
          <span className="text-brand">{token.text}</span>
        ) : (
          token.text
        );
        const index = picks.get(token.id);
        const chord = index === undefined ? undefined : chords[index];
        if (index === undefined || chord === undefined) {
          return <Fragment key={token.id}>{content}</Fragment>;
        }
        return (
          <span key={token.id} className="relative inline-block">
            <span
              aria-hidden
              className={cn(
                'absolute bottom-[calc(100%-0.22em)] left-0 font-mono text-[max(0.34em,0.6875rem)] leading-none font-semibold tracking-normal whitespace-nowrap',
                motion === 'scroll' ? 'about-chord' : 'about-chord-now',
                key ? CHORD_CLASS_COLOURS[classifyChord(chord, key)] : 'text-chord',
                STAGGER[index]
              )}
            >
              {chord}
            </span>
            {content}
          </span>
        );
      })}
    </Tag>
  );
}
