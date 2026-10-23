import { Folder } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { FilterSection, FilterSheet, FilterToggle } from '@/components/page/filter-sheet';
import { Segmented } from '@/components/primitives/segmented';

import type { SetlistOwnership } from './list';

const OWNERSHIP_OPTIONS = ['all', 'mine', 'shared'] as const satisfies readonly SetlistOwnership[];

type SetlistFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownership: SetlistOwnership;
  folderIds: readonly string[];
  folders: readonly { id: string; name: string; count: number }[];
  matchCount: number;
  onChange: (filters: { show?: SetlistOwnership; folders?: string[] }) => void;
};

export function SetlistFilterSheet({
  open,
  onOpenChange,
  ownership,
  folderIds,
  folders,
  matchCount,
  onChange,
}: SetlistFilterSheetProps) {
  const { t } = useTranslation();
  return (
    <FilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('setlists.filters.title')}
      summary={t('setlists.filters.matches', { count: matchCount })}
      showLabel={t('setlists.filters.show', { count: matchCount })}
      canShow={matchCount > 0}
      onReset={() => onChange({ show: 'all', folders: [] })}
    >
      <FilterSection title={t('setlists.filters.madeBy')}>
        <Segmented
          value={ownership}
          onChange={(show) => onChange({ show })}
          label={t('setlists.filters.madeBy')}
          fullWidth
          options={OWNERSHIP_OPTIONS.map((value) => ({
            value,
            label: t(`setlists.filters.ownership.${value}`),
          }))}
        />
      </FilterSection>
      {folders.length > 0 ? (
        <FilterSection
          title={t('setlists.filters.inFolders')}
          onClear={folderIds.length > 0 ? () => onChange({ folders: [] }) : undefined}
        >
          <div className="flex flex-wrap gap-1.5">
            {folders.map((folder) => (
              <FilterToggle
                key={folder.id}
                pressed={folderIds.includes(folder.id)}
                onToggle={() =>
                  onChange({
                    folders: folderIds.includes(folder.id)
                      ? folderIds.filter((id) => id !== folder.id)
                      : [...folderIds, folder.id],
                  })
                }
              >
                <Folder />
                {folder.name}
                <small className="text-ink-3 font-mono text-[0.6875rem]">{folder.count}</small>
              </FilterToggle>
            ))}
          </div>
        </FilterSection>
      ) : null}
    </FilterSheet>
  );
}
