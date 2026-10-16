import { ArrowDown, ArrowUp, X } from 'lucide-react';
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
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        {t('editor.noSongs')}
      </p>
    );
  }

  return (
    <ol className="divide-y rounded-lg border">
      {songs.map((song, index) => {
        const keyOptions = keyOptionsFor(song.originalKey);
        return (
          <li key={song._id} className="flex items-center gap-2 px-3 py-2">
            <span className="text-muted-foreground w-6 shrink-0 font-mono text-xs">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{song.title}</p>
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
                size="icon-sm"
                disabled={index === 0}
                aria-label={t('editor.moveUp', { title: song.title })}
                onClick={() => onChange(moveItem(songs, index, index - 1))}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === songs.length - 1}
                aria-label={t('editor.moveDown', { title: song.title })}
                onClick={() => onChange(moveItem(songs, index, index + 1))}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('editor.removeSong', { title: song.title })}
                onClick={() => onChange(songs.filter((entry) => entry._id !== song._id))}
              >
                <X />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
