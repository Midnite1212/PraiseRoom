import { Fragment } from 'react';

export type Mark = { offset: number; text: string; kind: 'plain' | 'strong' | 'code' | 'accent' };

const MARK_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/;

export const parseMarks = (text: string): Mark[] => {
  let offset = 0;
  return text
    .split(MARK_PATTERN)
    .filter((part) => part !== '')
    .map((part) => {
      const at = offset;
      offset += part.length;
      if (part.startsWith('**')) return { offset: at, text: part.slice(2, -2), kind: 'strong' };
      if (part.startsWith('`')) return { offset: at, text: part.slice(1, -1), kind: 'code' };
      if (part.startsWith('*') && part.length > 1) {
        return { offset: at, text: part.slice(1, -1), kind: 'accent' };
      }
      return { offset: at, text: part, kind: 'plain' };
    });
};

export const plainText = (text: string): string =>
  parseMarks(text)
    .map((mark) => mark.text)
    .join('');

export function MarkedText({ text }: { text: string }) {
  return parseMarks(text).map((mark) => {
    switch (mark.kind) {
      case 'strong':
        return (
          <strong key={mark.offset} className="text-ink font-semibold">
            {mark.text}
          </strong>
        );
      case 'code':
        return (
          <code
            key={mark.offset}
            className="bg-fill-hover rounded-md px-1.5 py-0.5 font-mono text-[0.9em]"
          >
            {mark.text}
          </code>
        );
      case 'accent':
        return (
          <span key={mark.offset} className="text-brand">
            {mark.text}
          </span>
        );
    }
    return <Fragment key={mark.offset}>{mark.text}</Fragment>;
  });
}
