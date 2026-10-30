import { useQuery } from '@tanstack/react-query';
import { Check } from 'pixelarticons/react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { EditorChip } from '@/components/editor/editor-chips';
import { FilterToggle } from '@/components/page/filter-sheet';
import { TempoMeter } from '@/components/primitives/tempo-meter';
import { Button } from '@/components/ui/button';
import { PopoverClose } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { keyLabel, type MusicKey } from '@/features/chords/theory';
import { TIME_SIGNATURE_OPTIONS } from '@/features/song-import/api';
import { cn } from '@/lib/utils';

import { TEMPO_LABEL_KEYS, TEMPO_OPTIONS, songThemesQueryOptions } from './api';
import { KEY_OPTIONS, keyOptionValue } from './key-options';
import { CREDITS_MAX_LENGTH, sameKey } from './song-draft';

function ChipHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-1 pt-0.5">
      <h2 className="text-base leading-snug font-semibold">{title}</h2>
      {hint ? <p className="text-ink-2 mt-0.5 text-[0.8125rem]">{hint}</p> : null}
    </div>
  );
}

function ChoiceButton({
  pressed,
  className,
  ...props
}: ComponentProps<'button'> & { pressed: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        'bg-fill-hover hover:bg-fill-press aria-pressed:bg-chord aria-pressed:text-ground grid h-11 place-items-center rounded-2xl font-mono font-bold transition-colors duration-150',
        className
      )}
      {...props}
    />
  );
}

type KeyChipProps = { value: MusicKey; auto: boolean; onChange: (key: MusicKey) => void };

export function KeySettingChip({ value, auto, onChange }: KeyChipProps) {
  const { t } = useTranslation();
  const majors = KEY_OPTIONS.filter((key) => !key.isMinor);
  const minors = KEY_OPTIONS.filter((key) => key.isMinor);
  return (
    <EditorChip
      label={t('songEditor.chips.key')}
      contentClassName="w-80"
      value={
        <>
          <b className="font-mono">{keyLabel(value)}</b>
          {auto ? (
            <small className="text-chord text-xs font-bold">{t('songEditor.auto')}</small>
          ) : null}
        </>
      }
    >
      <ChipHead
        title={t('songEditor.keyTitle')}
        hint={auto ? t('songEditor.keyAutoHint') : t('songEditor.keyHint')}
      />
      {[majors, minors].map((group) => (
        <div key={group.map(keyOptionValue).join()} className="grid grid-cols-4 gap-1.5">
          {group.map((key) => (
            <PopoverClose asChild key={keyOptionValue(key)}>
              <ChoiceButton pressed={sameKey(key, value)} onClick={() => onChange(key)}>
                {keyLabel(key)}
              </ChoiceButton>
            </PopoverClose>
          ))}
        </div>
      ))}
    </EditorChip>
  );
}

type TempoChipProps = { value: string[]; onChange: (tempo: string[]) => void };

export function TempoSettingChip({ value, onChange }: TempoChipProps) {
  const { t } = useTranslation();
  const current = TEMPO_OPTIONS.find((option) => option === value[0]);
  return (
    <EditorChip
      label={t('songEditor.chips.tempo')}
      contentClassName="w-72"
      value={
        <>
          <TempoMeter tempo={current ? [current] : []} />
          <span>{current ? t(TEMPO_LABEL_KEYS[current]) : t('songEditor.notSet')}</span>
        </>
      }
    >
      <ChipHead title={t('songEditor.chips.tempo')} />
      <div className="flex flex-col">
        {(['Slow', 'Medium Slow', 'Medium', 'Fast'] as const).map((option) => (
          <PopoverClose asChild key={option}>
            <button
              type="button"
              aria-pressed={option === current}
              onClick={() => onChange([option])}
              className="hover:bg-fill-hover aria-pressed:bg-fill-on flex h-12 items-center gap-3 rounded-2xl px-2.5 text-left font-semibold transition-colors"
            >
              <TempoMeter tempo={[option]} />
              <span className="flex-1">{t(TEMPO_LABEL_KEYS[option])}</span>
              {option === current ? <Check className="size-icon text-chord" aria-hidden /> : null}
            </button>
          </PopoverClose>
        ))}
      </div>
    </EditorChip>
  );
}

type TimeChipProps = { value: string[]; onChange: (time: string[]) => void };

export function TimeSettingChip({ value, onChange }: TimeChipProps) {
  const { t } = useTranslation();
  const current = value[0];
  return (
    <EditorChip
      label={t('songEditor.chips.time')}
      contentClassName="w-80"
      value={<b className="font-mono">{current ?? t('songEditor.notSet')}</b>}
    >
      <ChipHead title={t('songEditor.timeTitle')} />
      <div className="grid grid-cols-4 gap-1.5">
        {TIME_SIGNATURE_OPTIONS.map((option) => (
          <PopoverClose asChild key={option}>
            <ChoiceButton pressed={option === current} onClick={() => onChange([option])}>
              {option}
            </ChoiceButton>
          </PopoverClose>
        ))}
      </div>
    </EditorChip>
  );
}

type ThemesChipProps = { value: string[]; onChange: (themes: string[]) => void };

export function ThemesSettingChip({ value, onChange }: ThemesChipProps) {
  const { t } = useTranslation();
  const { data: themeOptions = [] } = useQuery(songThemesQueryOptions());
  const options = [...themeOptions, ...value.filter((theme) => !themeOptions.includes(theme))];
  const toggle = (theme: string) =>
    onChange(value.includes(theme) ? value.filter((item) => item !== theme) : [...value, theme]);
  return (
    <EditorChip
      label={t('songEditor.chips.themes')}
      contentClassName="w-96 max-w-[calc(100vw-24px)]"
      value={<span>{value.length > 0 ? value.length : t('songEditor.add')}</span>}
    >
      <ChipHead title={t('songEditor.chips.themes')} hint={t('songEditor.themesHint')} />
      <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
        {options.map((theme) => (
          <FilterToggle key={theme} pressed={value.includes(theme)} onToggle={() => toggle(theme)}>
            {theme}
          </FilterToggle>
        ))}
      </div>
      <div className="flex justify-end">
        <PopoverClose asChild>
          <Button type="button">{t('editor.frame.done')}</Button>
        </PopoverClose>
      </div>
    </EditorChip>
  );
}

type CodeChipProps = { value: string; onChange: (code: string) => void; onBlur: () => void };

export function CodeSettingChip({ value, onChange, onBlur }: CodeChipProps) {
  const { t } = useTranslation();
  return (
    <label className="bg-fill-hover inline-flex h-10 flex-none cursor-text items-center gap-2 rounded-full pr-3.5 pl-3.5 text-sm font-semibold transition-colors duration-150 focus-within:shadow-[inset_0_0_0_2px_var(--chord)]">
      <span className="text-ink-3 text-xs">{t('songEditor.chips.code')}</span>
      <input
        value={value}
        maxLength={8}
        size={5}
        aria-label={t('songEditor.codeLabel')}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="w-[6ch] bg-transparent p-0 font-mono text-sm font-semibold outline-none"
      />
    </label>
  );
}

type CreditsChipProps = { value: string; onChange: (credits: string) => void; onBlur: () => void };

export function CreditsSettingChip({ value, onChange, onBlur }: CreditsChipProps) {
  const { t } = useTranslation();
  return (
    <EditorChip
      label={t('songEditor.chips.credits')}
      contentClassName="w-96 max-w-[calc(100vw-24px)]"
      value={<span>{value.trim() === '' ? t('songEditor.add') : t('songEditor.added')}</span>}
    >
      <ChipHead title={t('songEditor.chips.credits')} hint={t('songEditor.creditsHint')} />
      <Textarea
        value={value}
        rows={4}
        maxLength={CREDITS_MAX_LENGTH}
        aria-label={t('songEditor.chips.credits')}
        placeholder={t('songEditor.creditsPlaceholder')}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <div className="flex justify-end">
        <PopoverClose asChild>
          <Button type="button">{t('editor.frame.done')}</Button>
        </PopoverClose>
      </div>
    </EditorChip>
  );
}
