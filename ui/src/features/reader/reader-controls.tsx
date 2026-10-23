import { CircleInfo, Link as LinkIcon } from 'pixelarticons/react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { LanguageChoice, ThemeChoice } from '@/components/layout/preference-choices';
import { Panel } from '@/components/primitives/panel';
import { Segmented } from '@/components/primitives/segmented';
import { SetRow } from '@/components/primitives/set-row';
import { Stepper } from '@/components/primitives/stepper';
import { Button } from '@/components/ui/button';
import {
  CHORD_NOTATIONS,
  type ChordNotation,
  READER_MODES,
  type ReaderMode,
  useReaderMode,
} from '@/features/reader/chord-display';
import {
  LYRICS_COLUMNS,
  type LyricsColumns,
  useLyricsColumns,
} from '@/features/reader/lyrics-columns';
import { LYRICS_SIZES, stepLyricsSize, useLyricsSize } from '@/features/reader/lyrics-size';

import type { ReaderSong } from './song';

const NOTATION_LABELS = { numbers: '1 4 5', letters: 'A B C' } as const;

export function ReaderModeToggle({
  mode,
  onChange,
  size = 'lg',
  glass = true,
}: {
  mode: ReaderMode;
  onChange: (mode: ReaderMode) => void;
  size?: 'md' | 'lg';
  glass?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Segmented
      glass={glass}
      size={size}
      value={mode}
      onChange={onChange}
      label={t('reader.mode')}
      options={READER_MODES.toReversed().map((value) => ({ value, label: t(`reader.${value}`) }))}
    />
  );
}

export function ChordNotationToggle({
  notation,
  onChange,
  glass = false,
}: {
  notation: ChordNotation;
  onChange: (notation: ChordNotation) => void;
  glass?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Segmented
      glass={glass}
      mono
      size={glass ? 'lg' : 'sm'}
      value={notation}
      onChange={onChange}
      label={t('reader.notation')}
      options={CHORD_NOTATIONS.toReversed().map((value) => ({
        value,
        label: NOTATION_LABELS[value],
        ariaLabel: t(`reader.${value}`),
      }))}
    />
  );
}

function ColumnBars({ count }: { count: number }) {
  return (
    <span aria-hidden className="flex items-center gap-0.5">
      {Array.from({ length: count }, (_, bar) => (
        <span key={bar} className="h-3.5 w-1 bg-current" />
      ))}
    </span>
  );
}

export function LyricsColumnsControl({
  columns,
  onChange,
}: {
  columns: LyricsColumns;
  onChange: (columns: LyricsColumns) => void;
}) {
  const { t } = useTranslation();
  return (
    <Segmented
      size="sm"
      value={columns}
      onChange={onChange}
      label={t('reader.lyricColumns')}
      options={LYRICS_COLUMNS.map((value) => ({
        value,
        label: <ColumnBars count={Number(value)} />,
        ariaLabel: t('reader.columns', { columns: value }),
      }))}
    />
  );
}

// Aa: how lyrics read on this device (size, columns), plus theme and language.
export function ReadingPanel({ trigger }: { trigger: ReactElement }) {
  const { t } = useTranslation();
  const [size, setSize] = useLyricsSize();
  const [columns, setColumns] = useLyricsColumns();
  const index = LYRICS_SIZES.indexOf(size);

  return (
    <Panel
      trigger={trigger}
      title={t('reader.reading')}
      align="end"
      sheetClassName="bottom-[calc(var(--bottom)+var(--dock-h)+10px)]"
    >
      <div className="flex flex-col gap-1.5">
        <SetRow label={t('reader.textSize')}>
          <Stepper
            value={t(`settings.textSize.options.${size}`)}
            onDecrease={() => setSize(stepLyricsSize(size, -1))}
            onIncrease={() => setSize(stepLyricsSize(size, 1))}
            decreaseLabel={t('reader.smaller')}
            increaseLabel={t('reader.larger')}
            canDecrease={index > 0}
            canIncrease={index < LYRICS_SIZES.length - 1}
          />
        </SetRow>
        <SetRow label={t('reader.lyricColumns')}>
          <LyricsColumnsControl columns={columns} onChange={setColumns} />
        </SetRow>
        <SetRow label={t('theme.label')}>
          <ThemeChoice />
        </SetRow>
        <SetRow label={t('language.label')}>
          <LanguageChoice />
        </SetRow>
      </div>
    </Panel>
  );
}

// Lyrics | Chords and Aa, for a live preview beside an editor.
export function ReaderPreferenceControls() {
  const { t } = useTranslation();
  const [mode, setMode] = useReaderMode();
  return (
    <>
      <ReaderModeToggle mode={mode} onChange={setMode} size="md" glass={false} />
      <ReadingPanel
        trigger={
          <Button variant="secondary" size="icon" aria-label={t('reader.reading')}>
            Aa
          </Button>
        }
      />
    </>
  );
}

export function ShareButton({ link }: { link: string | null | undefined }) {
  const { t } = useTranslation();
  if (!link) return null;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('reader.linkCopied'));
    } catch {
      toast.error(t('reader.linkCopyFailed'));
    }
  };
  return (
    <Button
      variant="glass"
      size="icon-lg"
      aria-label={t('reader.copyLink')}
      title={t('reader.copyLink')}
      onClick={() => void handleCopy()}
    >
      <LinkIcon />
    </Button>
  );
}

// ⓘ beside the title: the song's facts.
export function SongInfo({ song }: { song: ReaderSong }) {
  const { t } = useTranslation();
  const facts = [
    { label: t('reader.info.originalKey'), value: song.originalKey, mono: true },
    { label: t('reader.info.capo'), value: song.capo ? String(song.capo) : null, mono: true },
    { label: t('reader.info.timeSignature'), value: song.timeSignature.join(', '), mono: true },
    { label: t('reader.info.tempo'), value: song.tempo.join(', '), mono: false },
    { label: t('reader.info.code'), value: song.code, mono: true },
    { label: t('reader.info.year'), value: song.year, mono: true },
  ].filter(({ value }) => Boolean(value));
  const notes = [
    { label: t('reader.info.artist'), value: song.artist },
    { label: t('reader.info.themes'), value: song.themes.join(', ') },
  ].filter(({ value }) => Boolean(value));

  return (
    <Panel
      title={t('reader.info.title')}
      align="start"
      sheetClassName="bottom-[calc(var(--bottom)+var(--dock-h)+10px)]"
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="text-ink-3 flex-none"
          aria-label={t('reader.info.title')}
          title={t('reader.info.title')}
        >
          <CircleInfo />
        </Button>
      }
    >
      <dl className="grid grid-cols-3 gap-1.5">
        {facts.map(({ label, value, mono }) => (
          <div key={label} className="bg-fill-hover rounded-2xl px-3 py-2.5">
            <dt className="text-ink-3 text-xs">{label}</dt>
            <dd className={mono ? 'font-mono text-base font-bold' : 'text-sm font-semibold'}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <dl className="mx-0.5 grid gap-1.5 text-sm">
        {notes.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-ink-3 text-xs">{label}</dt>
            <dd className="text-ink-2">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
