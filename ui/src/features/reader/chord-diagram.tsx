import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import {
  barreSpans,
  type ChordShape,
  isUnderBarre,
  shapeTab,
} from '@/features/chords/chord-shapes';
import { cn } from '@/lib/utils';

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'] as const;
const FRETS = 4;
const FRET_LINES = [0, 1, 2, 3, 4] as const;
const STRING_GAP = 14;
const FRET_GAP = 18;
const LEFT = 18;
const TOP = 18;
const DOT_R = 5.5;
const RIGHT = LEFT + STRING_GAP * 5;
const BOTTOM = TOP + FRET_GAP * FRETS;

const stringX = (string: number) => LEFT + string * STRING_GAP;
const fretY = (fret: number) => TOP + (fret - 0.5) * FRET_GAP;

function Finger({ x, y, finger }: { x: number; y: number; finger: number }) {
  if (finger <= 0) return null;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-ground font-mono text-[7.5px] font-bold"
    >
      {finger}
    </text>
  );
}

// A guitar chord box: strings low E to high E from left to right, the nut (or the first fret's number) on top.
export function ChordDiagram({
  name,
  shape,
  className,
}: {
  name: string;
  shape: ChordShape;
  className?: string;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const spans = barreSpans(shape);

  return (
    <svg
      aria-labelledby={titleId}
      viewBox={`0 0 ${RIGHT + 8} ${BOTTOM + 4}`}
      className={cn('text-ink', className)}
    >
      <title id={titleId}>{t('reader.chordChart.shape', { name, frets: shapeTab(shape) })}</title>
      <g className="stroke-ink-3" strokeWidth={1}>
        {FRET_LINES.map((fret) => (
          <line
            key={`fret-${fret}`}
            x1={LEFT}
            x2={RIGHT}
            y1={TOP + fret * FRET_GAP}
            y2={TOP + fret * FRET_GAP}
          />
        ))}
        {STRING_NAMES.map((stringName, string) => (
          <line key={stringName} x1={stringX(string)} x2={stringX(string)} y1={TOP} y2={BOTTOM} />
        ))}
      </g>
      {shape.baseFret === 1 ? (
        <line
          x1={LEFT - 0.5}
          x2={RIGHT + 0.5}
          y1={TOP}
          y2={TOP}
          strokeWidth={3}
          className="stroke-ink"
        />
      ) : (
        <text
          x={LEFT - 6}
          y={fretY(1)}
          textAnchor="end"
          dominantBaseline="central"
          className="fill-ink-2 font-mono text-[9px] font-semibold"
        >
          {shape.baseFret}
        </text>
      )}
      {STRING_NAMES.map((stringName, string) => {
        const x = stringX(string);
        const fret = shape.frets[string] ?? -1;
        if (fret < 0) {
          return (
            <path
              key={stringName}
              d={`M${x - 3.5} ${TOP - 12.5}l7 7m0 -7l-7 7`}
              strokeWidth={1.5}
              className="stroke-ink-2"
            />
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={stringName}
              cx={x}
              cy={TOP - 9}
              r={3.5}
              strokeWidth={1.5}
              className="stroke-ink-2 fill-none"
            />
          );
        }
        if (isUnderBarre(spans, string, fret)) return null;
        return (
          <g key={stringName}>
            <circle cx={x} cy={fretY(fret)} r={DOT_R} className="fill-ink" />
            <Finger x={x} y={fretY(fret)} finger={shape.fingers[string] ?? 0} />
          </g>
        );
      })}
      {spans.map((span) => (
        <g key={span.fret}>
          <rect
            x={stringX(span.from) - DOT_R}
            y={fretY(span.fret) - DOT_R}
            width={stringX(span.to) - stringX(span.from) + DOT_R * 2}
            height={DOT_R * 2}
            rx={DOT_R}
            className="fill-ink"
          />
          <Finger x={stringX(span.from)} y={fretY(span.fret)} finger={span.finger} />
        </g>
      ))}
    </svg>
  );
}
