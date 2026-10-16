import { Info, Link2, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  CHORD_NOTATIONS,
  type ChordNotation,
  READER_MODES,
  type ReaderMode,
} from '@/features/reader/chord-display';
import { LYRICS_SIZES, type LyricsSize, stepLyricsSize } from '@/features/reader/lyrics-size';
import { cn } from '@/lib/utils';

import type { SetlistSong } from '../api';

const SIZE_METER_HEIGHTS = ['h-2', 'h-3', 'h-4', 'h-5', 'h-6'];

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  values.some((option) => option === value);

export function ReaderModeToggle({
  mode,
  onChange,
}: {
  mode: ReaderMode;
  onChange: (mode: ReaderMode) => void;
}) {
  const { t } = useTranslation();
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={mode}
      onValueChange={(value) => {
        if (isOneOf(READER_MODES, value)) onChange(value);
      }}
      aria-label={t('reader.mode')}
    >
      <ToggleGroupItem
        value="lyrics"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        {t('reader.lyrics')}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="chords"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        {t('reader.chords')}
      </ToggleGroupItem>
    </ToggleGroup>
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
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={notation}
      onValueChange={(value) => {
        if (isOneOf(CHORD_NOTATIONS, value)) onChange(value);
      }}
      aria-label={t('reader.notation')}
      className="font-mono"
    >
      <ToggleGroupItem value="numbers" aria-label={t('reader.numbers')}>
        1 4 5
      </ToggleGroupItem>
      <ToggleGroupItem value="letters" aria-label={t('reader.letters')}>
        A B C
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export function LyricsSizeControl({
  size,
  onChange,
}: {
  size: LyricsSize;
  onChange: (size: LyricsSize) => void;
}) {
  const { t } = useTranslation();
  const index = LYRICS_SIZES.indexOf(size);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t('reader.textSize')}>
          Aa
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <p className="mb-3 text-sm font-medium">{t('reader.textSize')}</p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label={t('reader.smaller')}
            disabled={index <= 0}
            onClick={() => onChange(stepLyricsSize(size, -1))}
          >
            <Minus />
          </Button>
          <div className="flex flex-1 items-end justify-center gap-1" aria-hidden>
            {LYRICS_SIZES.map((option, optionIndex) => (
              <span
                key={option}
                className={cn(
                  'w-2 rounded-sm',
                  SIZE_METER_HEIGHTS[optionIndex],
                  optionIndex <= index ? 'bg-primary' : 'bg-border'
                )}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('reader.larger')}
            disabled={index >= LYRICS_SIZES.length - 1}
            onClick={() => onChange(stepLyricsSize(size, 1))}
          >
            <Plus />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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
      variant="outline"
      size="icon-sm"
      aria-label={t('reader.copyLink')}
      onClick={() => void handleCopy()}
    >
      <Link2 />
    </Button>
  );
}

export function SongInfo({ song }: { song: SetlistSong }) {
  const { t } = useTranslation();
  const details = [
    { label: t('reader.info.artist'), value: song.artist },
    { label: t('reader.info.originalKey'), value: song.originalKey },
    { label: t('reader.info.code'), value: song.code },
    { label: t('reader.info.year'), value: song.year },
    { label: t('reader.info.tempo'), value: song.tempo.join(', ') },
    { label: t('reader.info.timeSignature'), value: song.timeSignature.join(', ') },
    { label: t('reader.info.themes'), value: song.themes.join(', ') },
  ].filter(({ value }) => Boolean(value));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={t('reader.info.title')}
        >
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {details.map(({ label, value }) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
