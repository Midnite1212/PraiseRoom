import { Close } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

export type ActiveFilter = { key: string; label: string; onRemove: () => void };

// The filters that are on, each one a chip that removes itself.
export function FilterChips({ filters }: { filters: readonly ActiveFilter[] }) {
  const { t } = useTranslation();
  if (filters.length === 0) return null;
  return (
    <div className="mt-1 mb-1.5 flex flex-wrap gap-1.5">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={filter.onRemove}
          aria-label={t('filters.remove', { name: filter.label })}
          className="bg-fill-on [&_svg]:size-icon [&_svg]:text-ink-2 inline-flex h-[30px] items-center gap-1 rounded-full pr-1.5 pl-3 text-[0.8125rem] font-semibold"
        >
          {filter.label}
          <Close />
        </button>
      ))}
    </div>
  );
}
