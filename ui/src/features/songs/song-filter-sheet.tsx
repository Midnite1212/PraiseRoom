import { Globe, SpeedFast, SpeedMedium, SpeedSlow } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { FilterSection, FilterSheet, FilterToggle } from '@/components/page/filter-sheet';
import { Segmented } from '@/components/primitives/segmented';

import { SONG_SORTS, type SongSort, TEMPO_LABEL_KEYS, TEMPO_OPTIONS, THEME_OPTIONS } from './api';

export type SongFilterValues = { tempo: string[]; themes: string[]; web: boolean; sort: SongSort };

const TEMPO_ICONS = {
  Fast: SpeedFast,
  Medium: SpeedMedium,
  'Medium Slow': SpeedMedium,
  Slow: SpeedSlow,
} as const;

const toggle = (values: readonly string[], value: string): string[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

type SongFilterSheetProps = SongFilterValues & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchCount: number | undefined;
  canSearchWeb: boolean;
  onChange: (filters: Partial<SongFilterValues>) => void;
};

export function SongFilterSheet({
  open,
  onOpenChange,
  tempo,
  themes,
  web,
  sort,
  matchCount,
  canSearchWeb,
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
      onReset={() => onChange({ tempo: [], themes: [], web: false, sort: 'title' })}
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
      <FilterSection title={t('songs.filters.sortBy')}>
        <Segmented
          value={sort}
          onChange={(next) => onChange({ sort: next })}
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
