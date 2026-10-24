import { Minus, Plus } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Panel } from '@/components/primitives/panel';
import { Stepper } from '@/components/primitives/stepper';
import { Button } from '@/components/ui/button';
import { conventionalKey, shapeKey, signedSemitones } from '@/features/chords/key-spelling';
import { keyLabel, type MusicKey } from '@/features/chords/theory';
import { cn } from '@/lib/utils';

import { activeCapo, MAX_CAPO, useGuitarCapo } from './chord-display';

type KeyPickerProps = {
  originalKey: MusicKey;
  playKey: MusicKey;
  onChange: (key: MusicKey) => void;
  capo?: number;
  onCapoChange?: (capo: number | null) => void;
  // `dock` is the taller pill in the phone's bottom row.
  placement?: 'head' | 'dock';
};

const formatOffset = (semitones: number): string =>
  semitones === 0 ? '0' : `${semitones > 0 ? '+' : '−'}${Math.abs(semitones)}`;

// The song's key as a pill (key and offset from the original); it opens the key panel.
export function KeyPicker({
  originalKey,
  playKey,
  onChange,
  capo = 0,
  onCapoChange,
  placement = 'head',
}: KeyPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [guitarCapo] = useGuitarCapo();
  const fret = activeCapo(guitarCapo, capo);
  const hasCapoRow = guitarCapo === 'on' && onCapoChange !== undefined;
  const offset = signedSemitones(originalKey, playKey);
  const options = Array.from({ length: 12 }, (_, root) =>
    conventionalKey(root, originalKey.isMinor)
  );
  const step = (semitones: number) =>
    onChange(conventionalKey(playKey.root + semitones, originalKey.isMinor));

  return (
    <Panel
      open={isOpen}
      onOpenChange={setIsOpen}
      title={t('reader.keyTitle')}
      align="end"
      sheetClassName="bottom-[calc(var(--bottom)+var(--dock-h)+10px)]"
      trigger={
        <button
          type="button"
          aria-label={
            fret
              ? `${t('reader.key')} ${keyLabel(playKey)}, ${t('reader.capoFret', { fret })}`
              : `${t('reader.key')} ${keyLabel(playKey)}`
          }
          className={cn(
            'inline-flex items-center gap-2 rounded-full pr-2 pl-3.5 text-sm font-semibold whitespace-nowrap transition-[background-color,transform] duration-200 ease-out active:scale-95',
            placement === 'dock'
              ? 'glass glass-over h-14'
              : 'bg-fill-hover hover:bg-fill-press aria-expanded:bg-fill-press h-10'
          )}
        >
          <span className="font-mono text-base font-bold">{keyLabel(playKey)}</span>
          <span
            className={cn(
              'inline-grid h-6 min-w-7 place-items-center rounded-full px-1.5 font-mono text-xs font-bold',
              offset === 0 ? 'text-ink-3' : 'bg-fill-on text-chord'
            )}
          >
            {formatOffset(offset)}
          </span>
          {fret ? (
            <span className="text-ink-2 text-xs font-semibold">
              {t('reader.capoFret', { fret })}
            </span>
          ) : null}
        </button>
      }
    >
      <div className="grid grid-cols-[52px_1fr_52px] items-center gap-2">
        <Button
          variant="secondary"
          className="size-[52px]"
          aria-label={t('reader.keyDown')}
          onClick={() => step(-1)}
        >
          <Minus />
        </Button>
        <div className="text-center font-mono text-4xl leading-none font-bold">
          {keyLabel(playKey)}
        </div>
        <Button
          variant="secondary"
          className="size-[52px]"
          aria-label={t('reader.keyUp')}
          onClick={() => step(1)}
        >
          <Plus />
        </Button>
      </div>
      <p className="text-ink-2 text-center text-[0.8125rem]">
        {offset === 0
          ? t('reader.originalKey', { key: keyLabel(originalKey) })
          : t('reader.fromOriginal', { offset: formatOffset(offset), key: keyLabel(originalKey) })}
      </p>
      <fieldset className="m-0 grid min-w-0 grid-cols-4 gap-1.5 border-0 p-0">
        <legend className="sr-only">{t('reader.key')}</legend>
        {options.map((option) => {
          const isOriginal = option.root === originalKey.root;
          return (
            <button
              key={option.root}
              type="button"
              aria-pressed={option.root === playKey.root}
              aria-label={
                isOriginal ? `${keyLabel(option)}, ${t('reader.original')}` : keyLabel(option)
              }
              onClick={() => onChange(option)}
              className={cn(
                'bg-fill-hover hover:bg-fill-press aria-pressed:bg-chord aria-pressed:text-ground relative h-11 rounded-xl font-mono font-semibold transition-colors',
                isOriginal &&
                  'after:absolute after:bottom-[5px] after:left-1/2 after:size-1 after:-translate-x-1/2 after:bg-current after:opacity-75'
              )}
            >
              {keyLabel(option)}
            </button>
          );
        })}
      </fieldset>
      {hasCapoRow ? (
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-ink-2 text-[0.8125rem] font-semibold">
            <b className="block font-semibold">{t('reader.capo')}</b>
            <small className="text-chord block text-xs font-semibold">
              {fret
                ? t('reader.playShapes', { key: keyLabel(shapeKey(playKey, fret)) })
                : t('reader.noCapo')}
            </small>
          </span>
          <Stepper
            value={fret}
            decreaseLabel={t('reader.capoDown')}
            increaseLabel={t('reader.capoUp')}
            canDecrease={fret > 0}
            canIncrease={fret < MAX_CAPO}
            onDecrease={() => onCapoChange(fret - 1)}
            onIncrease={() => onCapoChange(fret + 1)}
          />
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          disabled={offset === 0 && fret === 0}
          onClick={() => {
            onChange(originalKey);
            onCapoChange?.(null);
          }}
        >
          {t('reader.resetTo', { key: keyLabel(originalKey) })}
        </Button>
        <Button onClick={() => setIsOpen(false)}>{t('reader.done')}</Button>
      </div>
    </Panel>
  );
}
