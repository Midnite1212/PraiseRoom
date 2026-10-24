import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ReorderList } from '@/components/editor/reorder-list';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SetlistSongItem = {
  id: string;
  title: string;
  keyLabel: string;
  // Split: the song in the right pane is lit too, and a pinned one is tagged.
  isShown?: boolean;
  tag?: string;
};

type SetlistSongsProps = {
  songs: readonly SetlistSongItem[];
  currentIndex: number;
  onSelect: (songNumber: number) => void;
};

type SetlistSongRowsProps = SetlistSongsProps & {
  // Rows get a grip instead of selecting a song; `onReorder` receives the songs in their new order.
  isEditing?: boolean;
  onReorder?: (songs: SetlistSongItem[]) => void;
};

const pixelClasses = (index: number, currentIndex: number, isShown = false) =>
  index === currentIndex || isShown
    ? 'bg-pixel-on'
    : index < currentIndex
      ? 'bg-pixel-played'
      : 'bg-pixel-off';

function SongTag({ children }: { children: string }) {
  return (
    <span className="bg-fill-hover text-chord rounded-full px-[7px] py-px text-[0.6875rem] font-semibold">
      {children}
    </span>
  );
}

const rowClasses =
  'grid min-h-12 w-full items-center gap-2.5 rounded-[14px] px-2.5 py-1.5 text-left text-[0.9375rem]';

// The set as rows: a pixel (lit for the song on screen, dimmer once played), number, title and key. While editing,
// each row has a grip to drag it, or to move it with the arrow keys.
export function SetlistSongRows({
  songs,
  currentIndex,
  onSelect,
  isEditing = false,
  onReorder,
}: SetlistSongRowsProps) {
  if (isEditing && onReorder) {
    return (
      <ReorderList
        items={songs}
        getKey={(song) => song.id}
        getLabel={(song) => song.title}
        onReorder={onReorder}
        className="gap-0.5"
        renderItem={(song, index, handle) => (
          <div
            aria-current={index === currentIndex ? 'true' : undefined}
            className={cn(
              rowClasses,
              'aria-[current]:bg-fill-on gap-2 pl-0.5',
              song.isShown && 'bg-fill-on',
              song.tag
                ? 'grid-cols-[36px_10px_22px_minmax(0,1fr)_auto_auto]'
                : 'grid-cols-[36px_10px_22px_minmax(0,1fr)_auto]'
            )}
          >
            {handle}
            <span
              aria-hidden
              className={cn('size-2.5', pixelClasses(index, currentIndex, song.isShown))}
            />
            <span className="text-ink-3 font-mono text-[0.8125rem]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className={cn(
                'truncate',
                (index === currentIndex || song.isShown) && 'font-semibold'
              )}
            >
              {song.title}
            </span>
            {song.tag ? <SongTag>{song.tag}</SongTag> : null}
            <span className="text-ink-2 font-mono text-[0.8125rem] font-semibold">
              {song.keyLabel}
            </span>
          </div>
        )}
      />
    );
  }

  return (
    <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
      {songs.map((song, index) => (
        <li key={song.id}>
          <button
            type="button"
            onClick={() => onSelect(index + 1)}
            aria-current={index === currentIndex ? 'true' : undefined}
            className={cn(
              rowClasses,
              'hover:bg-fill-hover aria-[current]:bg-fill-on transition-colors',
              song.isShown && 'bg-fill-on',
              song.tag
                ? 'grid-cols-[10px_22px_minmax(0,1fr)_auto_auto]'
                : 'grid-cols-[10px_22px_minmax(0,1fr)_auto]'
            )}
          >
            <span
              aria-hidden
              className={cn('size-2.5', pixelClasses(index, currentIndex, song.isShown))}
            />
            <span className="text-ink-3 font-mono text-[0.8125rem]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className={cn(
                'truncate',
                (index === currentIndex || song.isShown) && 'font-semibold'
              )}
            >
              {song.title}
            </span>
            {song.tag ? <SongTag>{song.tag}</SongTag> : null}
            <span className="text-ink-2 font-mono text-[0.8125rem] font-semibold">
              {song.keyLabel}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

type EditOrderButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'size'> & {
  isEditing: boolean;
};

// "Edit order" while browsing the set, "Done" while reordering it. Spreads its props so it can be a panel trigger.
export function EditOrderButton({ isEditing, className, ...props }: EditOrderButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      variant="link"
      size="sm"
      className={cn('font-semibold whitespace-nowrap', className)}
      {...props}
    >
      {isEditing ? t('reader.done') : t('reader.editOrder')}
    </Button>
  );
}

type OrderFootProps = { isEditing: boolean; isCustom: boolean; onReset: () => void };

// Under the rows while reordering or after the order was changed: what it affects, and a way back.
export function OrderFoot({ isEditing, isCustom, onReset }: OrderFootProps) {
  const { t } = useTranslation();
  if (!isEditing && !isCustom) return null;
  return (
    <div className="border-hairline text-ink-3 mt-2 flex items-center justify-between gap-2 border-t pt-2 pl-2.5 text-[0.8125rem]">
      <span>{isCustom ? t('reader.yourOrder') : t('reader.orderNote')}</span>
      {isCustom ? (
        <Button variant="link" size="sm" onClick={onReset} className="font-semibold">
          {t('reader.reset')}
        </Button>
      ) : null}
    </div>
  );
}

// Wide screens with the sidebar folded: every song as a pill in one row under the top row.
export function SetlistSongbar({ songs, currentIndex, onSelect }: SetlistSongsProps) {
  return (
    <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
      {songs.map((song, index) => (
        <button
          key={song.id}
          type="button"
          title={song.title}
          onClick={() => onSelect(index + 1)}
          aria-current={index === currentIndex ? 'true' : undefined}
          className="text-ink-2 hover:bg-fill-hover hover:text-ink aria-[current]:bg-fill-on aria-[current]:text-ink flex h-10 min-w-[170px] flex-[1_1_0] items-center gap-2 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors aria-[current]:font-semibold"
        >
          <span aria-hidden className={cn('size-2 flex-none', pixelClasses(index, currentIndex))} />
          <span className="text-ink-3 flex-none font-mono text-[0.8125rem]">{index + 1}</span>
          <span className="min-w-0 truncate">{song.title}</span>
          <span className="text-ink-2 ml-auto flex-none font-mono text-[0.8125rem] font-semibold">
            {song.keyLabel}
          </span>
        </button>
      ))}
    </div>
  );
}

// Phones: the set's progress as pixels under the top row, with the count at the end.
export function SetlistProgress({ songs, currentIndex, onSelect }: SetlistSongsProps) {
  const { t } = useTranslation();
  return (
    <>
      <ol
        aria-label={t('reader.progress')}
        className="m-0 flex flex-1 list-none items-center gap-1 p-0"
      >
        {songs.map((song, index) => (
          <li key={song.id} className="flex-1">
            <button
              type="button"
              aria-label={`${index + 1}. ${song.title}`}
              aria-current={index === currentIndex ? 'true' : undefined}
              onClick={() => onSelect(index + 1)}
              className="grid h-5 w-full items-center"
            >
              <span
                aria-hidden
                className={cn(
                  'h-1 transition-colors duration-[400ms]',
                  pixelClasses(index, currentIndex),
                  index === currentIndex && 'pixel-glow'
                )}
              />
            </button>
          </li>
        ))}
      </ol>
      <span className="text-ink-3 ml-1.5 flex-none font-mono text-xs">
        {currentIndex + 1}/{songs.length}
      </span>
    </>
  );
}

type SetlistPickRowsProps = {
  songs: readonly SetlistSongItem[];
  // The positions to offer, in set order.
  indexes: readonly number[];
  // Pixels read as played before this position and lit at `selectedIndex`.
  currentIndex: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  // Rows above the songs.
  children?: ReactNode;
};

// A choose-a-song list: the set's rows with the chosen song marked.
export function SetlistPickRows({
  songs,
  indexes,
  currentIndex,
  selectedIndex,
  onSelect,
  children,
}: SetlistPickRowsProps) {
  return (
    <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
      {children}
      {indexes.map((index) => {
        const song = songs[index];
        if (!song) return null;
        const isSelected = index === selectedIndex;
        return (
          <li key={`${song.id}:${index}`}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={isSelected ? 'true' : undefined}
              className={cn(
                rowClasses,
                'hover:bg-fill-hover aria-[current]:bg-fill-on grid-cols-[10px_22px_minmax(0,1fr)_auto] transition-colors'
              )}
            >
              <span
                aria-hidden
                className={cn('size-2.5', pixelClasses(index, isSelected ? index : currentIndex))}
              />
              <span className="text-ink-3 font-mono text-[0.8125rem]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className={cn('truncate', isSelected && 'font-semibold')}>{song.title}</span>
              <span className="text-ink-2 font-mono text-[0.8125rem] font-semibold">
                {song.keyLabel}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
