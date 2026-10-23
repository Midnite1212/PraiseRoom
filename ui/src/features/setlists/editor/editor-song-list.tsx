import { ArrowDown, ArrowUp, Close } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { type EditorSong, keyOptionsFor, moveItem } from './editor-song';

type EditorSongListProps = {
  songs: EditorSong[];
  onChange: (songs: EditorSong[]) => void;
};

export function EditorSongList({ songs, onChange }: EditorSongListProps) {
  const { t } = useTranslation();

  if (songs.length === 0) {
    return (
      <p className="text-ink-2 border-hairline rounded-2xl border-[1.5px] border-dashed p-6 text-center text-sm">
        {t('editor.noSongs')}
      </p>
    );
  }

  return (
    <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
      {songs.map((song, index) => {
        const keyOptions = keyOptionsFor(song.originalKey);
        return (
          <li
            key={song._id}
            className="hover:bg-fill-hover flex min-h-[60px] items-center gap-2 rounded-2xl px-3 py-1.5 transition-colors"
          >
            <span className="text-ink-3 w-6 shrink-0 font-mono text-[0.8125rem]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{song.title}</p>
              <p className="text-muted-foreground truncate text-xs">{song.artist}</p>
            </div>
            {keyOptions.length > 0 ? (
              <Select
                value={song.key}
                onValueChange={(key) =>
                  onChange(
                    songs.map((entry) => (entry._id === song._id ? { ...entry, key } : entry))
                  )
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-20 font-mono"
                  aria-label={t('editor.keyFor', { title: song.title })}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {keyOptions.map((option) => (
                    <SelectItem key={option} value={option} className="font-mono">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="w-20 text-center font-mono text-sm">{song.originalKey}</span>
            )}
            <div className="flex shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                aria-label={t('editor.moveUp', { title: song.title })}
                onClick={() => onChange(moveItem(songs, index, index - 1))}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === songs.length - 1}
                aria-label={t('editor.moveDown', { title: song.title })}
                onClick={() => onChange(moveItem(songs, index, index + 1))}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('editor.removeSong', { title: song.title })}
                onClick={() => onChange(songs.filter((entry) => entry._id !== song._id))}
              >
                <Close />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
