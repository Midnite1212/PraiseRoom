import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { keyForSong, type Setlist } from '../api';

type SetlistRailProps = {
  setlist: Setlist;
  currentIndex: number;
  currentKeyLabel: string;
  onNavigate?: () => void;
};

export function SetlistRail({
  setlist,
  currentIndex,
  currentKeyLabel,
  onNavigate,
}: SetlistRailProps) {
  const { t } = useTranslation();

  return (
    <nav aria-label={t('reader.setlist')} className="flex h-full flex-col">
      <div className="px-2 pb-3">
        <h2 className="font-semibold">{t('reader.setlist')}</h2>
        <p className="text-muted-foreground text-xs">
          {t('reader.songCount', { count: setlist.songs.length })}
        </p>
      </div>
      <ol className="flex flex-col gap-0.5">
        {setlist.songs.map((song, index) => {
          const isCurrent = index === currentIndex;
          return (
            <li key={song._id}>
              <Link
                to="/setlists/$setlistId"
                params={{ setlistId: setlist._id }}
                search={{ song: index + 1 }}
                replace
                onClick={onNavigate}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent/60',
                  isCurrent && 'bg-accent font-medium text-accent-foreground'
                )}
              >
                <span className="text-muted-foreground w-5 shrink-0 font-mono text-xs">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate">{song.title}</span>
                <span className="bg-sheet shrink-0 rounded border px-1.5 font-mono text-xs">
                  {isCurrent ? currentKeyLabel : keyForSong(setlist, song)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground mt-auto hidden items-center gap-1.5 px-2 pt-4 text-xs lg:flex">
        <kbd className="bg-sheet rounded border px-1 font-mono">←</kbd>
        <kbd className="bg-sheet rounded border px-1 font-mono">→</kbd>
        {t('reader.changeSongs')}
      </p>
    </nav>
  );
}
