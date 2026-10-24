import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { IconTooltip } from '@/components/primitives/icon-tooltip';
import { moveItem } from '@/lib/move-item';
import { cn } from '@/lib/utils';

type ReorderListProps<T> = {
  items: readonly T[];
  getKey: (item: T) => string;
  // The name read out by the handle and by the position announcement.
  getLabel: (item: T) => string;
  onReorder: (items: T[]) => void;
  // Lay out one row; put `handle` wherever the grip belongs.
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode;
  className?: string;
  itemClassName?: string;
};

type Drag = { key: string; from: number; over: number };

// A list reordered by dragging a grip (the rows move live under the pointer) or by pressing the up and down arrows on
// the focused grip, with each keyboard move announced to screen readers.
export function ReorderList<T>({
  items,
  getKey,
  getLabel,
  onReorder,
  renderItem,
  className,
  itemClassName,
}: ReorderListProps<T>) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLOListElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const focusKey = useRef<string | null>(null);
  const over = useRef(0);
  const live = useRef({ items, onReorder, drag, getLabel });

  useEffect(() => {
    live.current = { items, onReorder, drag, getLabel };
  });

  useEffect(() => {
    const key = focusKey.current;
    if (key === null) return;
    focusKey.current = null;
    for (const handle of listRef.current?.querySelectorAll<HTMLElement>('[data-reorder-handle]') ??
      []) {
      if (handle.dataset.reorderHandle === key) handle.focus();
    }
  });

  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event: globalThis.PointerEvent) => {
      const rows = Array.from(listRef.current?.children ?? []);
      const index = rows.findIndex((row) => {
        const box = row.getBoundingClientRect();
        return event.clientY > box.top && event.clientY < box.bottom;
      });
      if (index < 0 || index === over.current) return;
      over.current = index;
      setDrag((current) => (current ? { ...current, over: index } : current));
    };
    const finish = () => {
      const { items: current, onReorder: commit, drag: active, getLabel: label } = live.current;
      setDrag(null);
      const moved = active ? current[active.from] : undefined;
      if (!active || moved === undefined || over.current === active.from) return;
      commit(moveItem(current, active.from, over.current));
      setAnnouncement(
        t('editor.frame.moved', {
          title: label(moved),
          position: over.current + 1,
          count: current.length,
        })
      );
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [dragging, t]);

  const shown = drag ? moveItem(items, drag.from, drag.over) : items;

  const startDrag = (event: PointerEvent, key: string, index: number) => {
    if (event.button !== 0) return;
    event.preventDefault();
    over.current = index;
    setDrag({ key, from: index, over: index });
  };

  const moveWithKeys = (event: KeyboardEvent, item: T, index: number) => {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const to = index + step;
    if (to < 0 || to >= items.length) return;
    focusKey.current = getKey(item);
    onReorder(moveItem(items, index, to));
    setAnnouncement(
      t('editor.frame.moved', { title: getLabel(item), position: to + 1, count: items.length })
    );
  };

  return (
    <>
      <ol ref={listRef} className={cn('m-0 flex list-none flex-col p-0', className)}>
        {shown.map((item, index) => {
          const key = getKey(item);
          const handle = (
            <IconTooltip label={t('editor.frame.dragToReorder')}>
              <button
                type="button"
                data-reorder-handle={key}
                aria-label={t('editor.frame.moveHandle', { title: getLabel(item) })}
                onPointerDown={(event) => startDrag(event, key, index)}
                onKeyDown={(event) => moveWithKeys(event, item, index)}
                className="text-ink-3 hover:text-ink hover:bg-fill-hover wide:w-9 grid h-11 w-7 flex-none cursor-grab touch-none place-items-center rounded-xl transition-colors active:cursor-grabbing"
              >
                <svg viewBox="0 0 18 18" className="size-icon fill-current" aria-hidden>
                  <rect x="3" y="6" width="12" height="2" />
                  <rect x="3" y="10" width="12" height="2" />
                </svg>
              </button>
            </IconTooltip>
          );
          return (
            <li
              key={key}
              data-dragging={drag?.key === key ? '' : undefined}
              className={cn(
                'transition-[transform,box-shadow] duration-150 ease-out data-dragging:bg-ground data-dragging:relative data-dragging:z-10 data-dragging:scale-[1.015] data-dragging:rounded-2xl data-dragging:shadow-[0_14px_30px_-12px_var(--shadow)]',
                itemClassName
              )}
            >
              {renderItem(item, index, handle)}
            </li>
          );
        })}
      </ol>
      <output aria-live="assertive" className="sr-only">
        {announcement}
      </output>
    </>
  );
}
