import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { TEMPO_OPTIONS, THEME_OPTIONS } from './api';

export type SongFilterValues = { tempo: string[]; themes: string[] };

type SongFiltersProps = SongFilterValues & {
  onChange: (filters: SongFilterValues) => void;
};

const TEMPO_LABEL_KEYS = {
  Fast: 'songs.tempo.fast',
  Medium: 'songs.tempo.medium',
  Slow: 'songs.tempo.slow',
  'Medium Slow': 'songs.tempo.mediumSlow',
} as const;

export function SongFilters({ tempo, themes, onChange }: SongFiltersProps) {
  const { t } = useTranslation();
  const activeCount = tempo.length + themes.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal />
          {t('songs.filters.button')}
          {activeCount > 0 ? (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(36rem,calc(100vw-2rem))]">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">{t('songs.filters.tempo')}</h2>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={tempo}
              onValueChange={(value) => onChange({ tempo: value, themes })}
              className="flex-wrap justify-start"
            >
              {TEMPO_OPTIONS.map((option) => (
                <ToggleGroupItem key={option} value={option}>
                  {t(TEMPO_LABEL_KEYS[option])}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">{t('songs.filters.themes')}</h2>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={themes}
              onValueChange={(value) => onChange({ tempo, themes: value })}
              className="flex-wrap justify-start gap-1.5"
            >
              {THEME_OPTIONS.map((option) => (
                <ToggleGroupItem key={option} value={option} className="rounded-full">
                  {option}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeCount === 0}
              onClick={() => onChange({ tempo: [], themes: [] })}
            >
              {t('songs.filters.clear')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
