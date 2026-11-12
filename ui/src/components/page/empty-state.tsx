import { Close } from 'pixelarticons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  children,
  action,
  onClearSearch,
  onClearFilters,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn('text-ink-2 px-4 py-10 text-center', className)}>
      <b className="text-ink mb-1 block">{title}</b>
      {children}
      {action || onClearSearch || onClearFilters ? (
        <span className="mt-3.5 flex flex-wrap justify-center gap-2">
          {action}
          {onClearSearch ? (
            <Button variant="ghost" size="sm" className="wide:h-9 h-11" onClick={onClearSearch}>
              <Close />
              {t('filters.clearSearch')}
            </Button>
          ) : null}
          {onClearFilters ? (
            <Button variant="ghost" size="sm" className="wide:h-9 h-11" onClick={onClearFilters}>
              {t('filters.clearAll')}
            </Button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
