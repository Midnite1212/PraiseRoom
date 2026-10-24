import { ArrowDown, ArrowUp, Close, Minus, Plus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { ReorderList } from '@/components/editor/reorder-list';
import { TempoMeter } from '@/components/primitives/tempo-meter';
import { Button } from '@/components/ui/button';

import { type DraftSong, keyJump, keyOffset } from './setlist-draft';

type SongRowsProps = {
  songs: DraftSong[];
  onReorder: (songs: DraftSong[]) => void;
  onStepKey: (songId: string, step: 1 | -1) => void;
  onRemove: (song: DraftSong) => void;
};

const KEY_BUTTON_CLASSES =
  'text-ink-2 hover:text-ink hover:bg-fill-press grid size-7 wide:size-8 place-items-center rounded-full transition-colors [&_svg]:size-icon';

// The set's songs as draggable rows: a handle, the number, title and artist, the tempo (wide screens), the key change
// from the song before, the key for this set with how far it sits from the original, and remove.
export function SongRows({ songs, onReorder, onStepKey, onRemove }: SongRowsProps) {
  const { t } = useTranslation();
  return (
    <ReorderList
      items={songs}
      getKey={({ _id }) => _id}
      getLabel={({ title }) => title}
      onReorder={onReorder}
      className="gap-0.5"
      itemClassName="rounded-2xl"
      renderItem={(song, index, handle) => {
        const jump = keyJump(songs, index);
        const offset = keyOffset(song);
        const previous = songs[index - 1];
        return (
          <div className="hover:bg-fill-hover wide:grid-cols-[36px_20px_minmax(0,1fr)_auto_36px_auto_36px] wide:gap-2 grid min-h-[60px] grid-cols-[28px_14px_minmax(0,1fr)_auto_auto_28px] items-center gap-1.5 rounded-2xl py-1 pr-1 transition-colors duration-150 ease-out">
            {handle}
            <span className="text-ink-3 font-mono text-[0.8125rem] font-semibold">{index + 1}</span>
            <span className="min-w-0 py-1">
              <span className="block truncate font-semibold">{song.title}</span>
              <span className="text-ink-2 mt-0.5 block truncate text-[0.8125rem]">
                {song.artist}
              </span>
            </span>
            <TempoMeter tempo={song.tempo} className="wide:inline-flex hidden" />
            <span
              title={
                jump !== 0 && previous ? t('editor.keyChange', { key: previous.key }) : undefined
              }
              className={
                jump === 0
                  ? 'invisible'
                  : 'text-ink-2 inline-flex items-center justify-end gap-px font-mono text-xs font-bold'
              }
            >
              {jump === 0 ? null : (
                <>
                  {jump > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                  <span aria-hidden>{Math.abs(jump)}</span>
                  <span className="sr-only">
                    {t(jump > 0 ? 'editor.jumpUp' : 'editor.jumpDown', { count: Math.abs(jump) })}
                  </span>
                </>
              )}
            </span>
            <fieldset className="bg-fill-hover m-0 inline-flex h-9 min-w-0 items-center rounded-full border-0 p-0.5">
              <legend className="sr-only">{t('editor.keyFor', { title: song.title })}</legend>
              <button
                type="button"
                className={KEY_BUTTON_CLASSES}
                aria-label={t('editor.keyDown')}
                onClick={() => onStepKey(song._id, -1)}
              >
                <Minus />
              </button>
              <b className="inline-flex min-w-7.5 items-center justify-center gap-1 font-mono text-sm font-bold">
                {song.key}
                {offset === 0 ? null : (
                  <small className="bg-fill-on text-chord rounded-full px-1.5 py-px font-mono text-[0.6875rem] font-bold">
                    {offset > 0 ? '+' : '−'}
                    {Math.abs(offset)}
                  </small>
                )}
              </b>
              <button
                type="button"
                className={KEY_BUTTON_CLASSES}
                aria-label={t('editor.keyUp')}
                onClick={() => onStepKey(song._id, 1)}
              >
                <Plus />
              </button>
            </fieldset>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wide:size-9 size-7"
              aria-label={t('editor.removeSong', { title: song.title })}
              title={t('editor.remove')}
              onClick={() => onRemove(song)}
            >
              <Close />
            </Button>
          </div>
        );
      }}
    />
  );
}
