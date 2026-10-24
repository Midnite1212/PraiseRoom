import { useTranslation } from 'react-i18next';

import { parseKey } from '@/features/chords/theory';
import {
  useAccidentals,
  useChordNotation,
  useChordStyle,
  useColourChords,
} from '@/features/reader/chord-display';
import { LyricsSheet } from '@/features/reader/lyrics-sheet';
import { useLyricsSize } from '@/features/reader/lyrics-size';
import { cn } from '@/lib/utils';

const PREVIEW_KEY = parseKey('E');

const NOTATION_NAMES = { numbers: '1 4 5', letters: 'A B C' } as const;

const isSectionLine = (line: string) => line.startsWith('{');

// A small reader drawn with the saved settings: the real chart renderer on a short dummy chart, so it
// follows every Songs setting. Wide screens show a titled card with a verse; phones show one line.
export function SettingsPreview({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const [lyricsSize] = useLyricsSize();
  const [notation] = useChordNotation();
  const [chordStyle] = useChordStyle();
  const [accidentals] = useAccidentals();
  const [colourChords] = useColourChords();

  const chartLines = t('settings.preview.chart').split('\n');
  const chart = compact
    ? (chartLines.find((line) => !isSectionLine(line)) ?? '')
    : chartLines.join('\n');
  const meta = [
    t(`settings.textSize.options.${lyricsSize}`),
    NOTATION_NAMES[notation],
    t(`settings.preview.${chordStyle}`),
    ...(colourChords === 'on' ? [t('settings.preview.coloured')] : []),
  ].join(' · ');

  return (
    <aside
      aria-label={t('settings.preview.aria')}
      data-lyrics-size={lyricsSize}
      className={cn(
        'glass [--glass-blur:3px] [--glass-r:24px]',
        compact
          ? 'glass-strong top-[calc(var(--top)+56px)] sticky z-5 overflow-hidden px-4 py-3 [&_p]:flex-nowrap'
          : 'px-[22px] py-5'
      )}
    >
      {compact ? null : (
        <div className="mb-[18px] flex items-start justify-between gap-3">
          <span>
            <b className="block text-lg font-bold tracking-[-0.01em]">
              {t('settings.preview.title')}
            </b>
            <small className="text-ink-3 mt-0.5 block text-[0.8125rem]">
              {t('settings.preview.subtitle')}
            </small>
          </span>
          <span className="bg-fill-hover grid h-7 min-w-[34px] place-items-center rounded-lg px-2 font-mono text-[0.8125rem] font-bold whitespace-nowrap">
            {notation === 'numbers' ? t('settings.preview.numbersKey', { key: 'E' }) : 'E'}
          </span>
        </div>
      )}
      <div className="[&_section]:mb-0 [&>div]:transition-[font-size] [&>div]:duration-200 [&>div]:ease-out">
        <LyricsSheet
          chordLyrics={chart}
          mode="chords"
          notation={notation}
          accidentals={accidentals}
          chordStyle={chordStyle}
          colourChords={colourChords === 'on'}
          originalKey={PREVIEW_KEY}
          playKey={PREVIEW_KEY}
          columns="1"
        />
      </div>
      <p
        className={cn('text-ink-3 flex items-center gap-2 text-xs', compact ? 'mt-1.5' : 'mt-3.5')}
      >
        {compact ? (
          <span className="text-ink-2 font-bold">{t('settings.preview.label')}</span>
        ) : null}
        {meta}
      </p>
    </aside>
  );
}
