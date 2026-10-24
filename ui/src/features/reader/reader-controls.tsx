import { CircleInfo, Link as LinkIcon } from 'pixelarticons/react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Panel } from '@/components/primitives/panel';
import { Segmented } from '@/components/primitives/segmented';
import { Tray } from '@/components/primitives/tray';
import { Button } from '@/components/ui/button';
import {
  CHORD_NOTATIONS,
  type ChordNotation,
  READER_MODES,
  type ReaderMode,
  useReaderMode,
} from '@/features/reader/chord-display';
import { LYRICS_COLUMNS, type LyricsColumns } from '@/features/reader/lyrics-columns';
import { LYRICS_SIZES, stepLyricsSize, useLyricsSize } from '@/features/reader/lyrics-size';
import { useIsWide } from '@/hooks/use-wide';
import { cn } from '@/lib/utils';

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
      optionClassName="px-3 wide:px-4"
      options={READER_MODES.toReversed().map((value) => ({ value, label: t(`reader.${value}`) }))}
    />
  );
}

export function ChordNotationToggle({
  notation,
  onChange,
}: {
  notation: ChordNotation;
  onChange: (notation: ChordNotation) => void;
}) {
  const { t } = useTranslation();
  return (
    <Segmented
      mono
      size="sm"
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

function SizeStep({
  label,
  large,
  disabled,
  onClick,
}: {
  label: string;
  large?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'bg-fill-hover hover:bg-fill-press grid h-[52px] place-items-center rounded-2xl font-bold transition-colors duration-200 ease-out disabled:opacity-35',
        large ? 'text-[1.375rem]' : 'text-sm'
      )}
    >
      A
    </button>
  );
}

// Aa: a live tray for the lyric size, with a tick per size.
export function ReadingPanel({ trigger }: { trigger: ReactElement }) {
  const { t } = useTranslation();
  const [size, setSize] = useLyricsSize();
  const index = LYRICS_SIZES.indexOf(size);

  return (
    <Tray trigger={trigger} title={t('reader.reading')}>
      <div className="grid grid-cols-[52px_minmax(0,1fr)_52px] items-center gap-2">
        <SizeStep
          label={t('reader.smaller')}
          disabled={index <= 0}
          onClick={() => setSize(stepLyricsSize(size, -1))}
        />
        <div className="grid justify-items-center gap-1.5">
          <span aria-hidden className="flex gap-1">
            {LYRICS_SIZES.map((step, tick) => (
              <i
                key={step}
                className={cn('h-1 w-3.5', tick <= index ? 'bg-pixel-on' : 'bg-pixel-off')}
              />
            ))}
          </span>
          <output className="text-ink-2 font-mono text-xs font-semibold">
            {t(`settings.textSize.options.${size}`)}
          </output>
        </div>
        <SizeStep
          large
          label={t('reader.larger')}
          disabled={index >= LYRICS_SIZES.length - 1}
          onClick={() => setSize(stepLyricsSize(size, 1))}
        />
      </div>
    </Tray>
  );
}

// Wide screens: Aa in the top row (phones have it in the dock).
export function WideReadingControls() {
  const { t } = useTranslation();
  const isWide = useIsWide();
  if (!isWide) return null;
  return (
    <ReadingPanel
      trigger={
        <Button
          variant="glass"
          size="icon-lg"
          className="text-[0.9375rem]"
          aria-label={t('reader.reading')}
        >
          Aa
        </Button>
      }
    />
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
