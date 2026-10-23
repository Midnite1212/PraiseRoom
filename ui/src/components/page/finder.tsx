import { Close, Filter, Search } from 'pixelarticons/react';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FinderProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  filterCount?: number;
  onFilter?: () => void;
  maxLength?: number;
  inputRef?: Ref<HTMLInputElement>;
  sticky?: boolean;
};

// Search (and filter) under the page title. It sticks as the list scrolls (unless `sticky` is off): under the top bar on phones,
// at the top of the window on wide screens, with its own fade band behind it once the page has moved.
export function Finder({
  value,
  onChange,
  placeholder,
  label,
  filterCount = 0,
  onFilter,
  maxLength,
  inputRef,
  sticky = true,
}: FinderProps) {
  const { t } = useTranslation();
  return (
    <div
      data-finder
      className={cn(
        'z-20 mb-1.5 flex gap-2',
        sticky ? 'wide:top-3.5 sticky top-[calc(var(--top)+58px)]' : 'relative'
      )}
    >
      <div
        aria-hidden
        hidden={!sticky}
        className="finder-band wide:-inset-x-12 wide:-top-3.5 pointer-events-none absolute -inset-x-(--pg) top-[calc((var(--top)+58px)*-1)] -bottom-[18px] -z-10 opacity-0 transition-opacity duration-200 ease-out in-[.scrolled]:opacity-100"
      />
      <search className="glass glass-over flex h-12 min-w-0 flex-1 items-center gap-2 pr-1.5 pl-4">
        <Search className="size-icon text-ink-2 flex-none" />
        <input
          ref={inputRef}
          type="search"
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          className="placeholder:text-ink-3 h-full min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('filters.clearSearch')}
            onClick={() => onChange('')}
          >
            <Close />
          </Button>
        ) : null}
      </search>
      {onFilter ? (
        <Button
          variant="glass"
          size="icon-lg"
          aria-pressed={filterCount > 0}
          aria-label={
            filterCount > 0
              ? t('filters.buttonWithCount', { count: filterCount })
              : t('filters.button')
          }
          title={t('filters.button')}
          onClick={onFilter}
          className="relative flex-none"
        >
          <Filter />
          {filterCount > 0 ? (
            <span className="bg-chord text-ground absolute top-1 right-1 z-10 grid h-[18px] min-w-[18px] place-items-center rounded-full px-[5px] font-mono text-[0.6875rem] font-bold">
              {filterCount}
            </span>
          ) : null}
        </Button>
      ) : null}
    </div>
  );
}
