import { Globe, SpeedFast, SpeedMedium, SpeedSlow } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { FilterSection, FilterSheet, FilterToggle } from '@/components/page/filter-sheet';
import { Segmented } from '@/components/primitives/segmented';

import {
  SONG_SORTS,
  type SongSort,
  type SortDirection,
  TEMPO_LABEL_KEYS,
  TEMPO_OPTIONS,
  THEME_OPTIONS,
} from './api';
import { KEY_FILTER_OPTIONS, type KeyFilterOption } from './key-options';

export type SongFilterValues = {
  tempo: string[];
  themes: string[];
  keys: KeyFilterOption[];
  web: boolean;
  sort: SongSort;
  dir: SortDirection;
};

const TEMPO_ICONS = {
  Fast: SpeedFast,
  Medium: SpeedMedium,
  'Medium Slow': SpeedMedium,
  Slow: SpeedSlow,
} as const;

const toggle = <T extends string>(values: readonly T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

type SongFilterSheetProps = Omit<SongFilterValues, 'dir'> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchCount: number | undefined;
  canSearchWeb: boolean;
  availableKeys: ReadonlySet<string> | undefined;
  onChange: (filters: Partial<SongFilterValues>) => void;
};

export function SongFilterSheet({
  open,
  onOpenChange,
  tempo,
  themes,
  keys,
  web,
  sort,
  matchCount,
  canSearchWeb,
  availableKeys,
  onChange,
}: SongFilterSheetProps) {
  const { t } = useTranslation();
  const count = matchCount ?? 0;
  return (
    <FilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('songs.filters.title')}
      summary={t('songs.filters.matches', { count })}
      showLabel={t('songs.filters.show', { count })}
      canShow={count > 0}
      onReset={() =>
        onChange({ tempo: [], themes: [], keys: [], web: false, sort: 'title', dir: 'asc' })
      }
    >
      <FilterSection
        title={t('songs.filters.tempo')}
        onClear={tempo.length > 0 ? () => onChange({ tempo: [] }) : undefined}
      >
        <div className="grid grid-cols-4 gap-1.5">
          {TEMPO_OPTIONS.map((option) => {
            const Icon = TEMPO_ICONS[option];
            return (
              <FilterToggle
                key={option}
                shape="tile"
                pressed={tempo.includes(option)}
                onToggle={() => onChange({ tempo: toggle(tempo, option) })}
              >
                <Icon />
                {t(TEMPO_LABEL_KEYS[option])}
              </FilterToggle>
            );
          })}
        </div>
      </FilterSection>
      <FilterSection
        title={t('songs.filters.themes')}
        onClear={themes.length > 0 ? () => onChange({ themes: [] }) : undefined}
      >
        <div className="flex flex-wrap gap-1.5">
          {THEME_OPTIONS.map((option) => (
            <FilterToggle
              key={option}
              pressed={themes.includes(option)}
              onToggle={() => onChange({ themes: toggle(themes, option) })}
            >
              {option}
            </FilterToggle>
          ))}
        </div>
      </FilterSection>
      <FilterSection
        title={t('songs.filters.originalKey')}
        onClear={keys.length > 0 ? () => onChange({ keys: [] }) : undefined}
      >
        <div className="grid grid-cols-6 gap-1">
          {KEY_FILTER_OPTIONS.map((option) => {
            const pressed = keys.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={pressed}
                disabled={!pressed && availableKeys !== undefined && !availableKeys.has(option)}
                onClick={() => onChange({ keys: toggle(keys, option) })}
                className="bg-fill-hover text-ink aria-pressed:bg-chord aria-pressed:text-ground disabled:text-ink-3 h-10 rounded-xl font-mono text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
              >
                {option}
              </button>
            );
          })}
        </div>
      </FilterSection>
      <FilterSection title={t('songs.filters.sortBy')}>
        <Segmented
          value={sort}
          onChange={(next) => onChange({ sort: next, dir: 'asc' })}
          label={t('songs.filters.sortBy')}
          fullWidth
          options={SONG_SORTS.map((value) => ({ value, label: t(`songs.columns.${value}`) }))}
        />
      </FilterSection>
      {canSearchWeb ? (
        <FilterSection title={t('songs.filters.more')}>
          <FilterToggle pressed={web} onToggle={() => onChange({ web: !web })}>
            <Globe />
            {t('songs.searchWeb')}
          </FilterToggle>
        </FilterSection>
      ) : null}
    </FilterSheet>
  );
}
