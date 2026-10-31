import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { PenSquare, Plus } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { canWriteSongs } from '@/features/auth/session';
import { type MusicKey, parseKey } from '@/features/chords/theory';
import { useAutoScroll } from '@/features/reader/auto-scroll';
import { AutoScrollButton } from '@/features/reader/auto-scroll-controls';
import { useReaderMode } from '@/features/reader/chord-display';
import { KeyPicker } from '@/features/reader/key-picker';
import { toPresentSong } from '@/features/reader/present-slides';
import { ReaderBack } from '@/features/reader/reader-back';
import { ReadingPanel, WideReadingControls } from '@/features/reader/reader-controls';
import { ReaderLayout } from '@/features/reader/reader-layout';
import { ReaderModes } from '@/features/reader/reader-modes';
import { ReadingSettings } from '@/features/reader/reading-settings';
import { useSongCapo } from '@/features/reader/song-capo';
import { SongReader } from '@/features/reader/song-reader';
import { useKeyShortcuts } from '@/features/reader/use-key-shortcuts';
import { AddToSetlist } from '@/features/setlists/add-to-setlist';
import { type Song, songQueryOptions, songSlug } from '@/features/songs/api';
import { ensureFromSlug } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/songs/$songSlug')({
  staticData: { chrome: 'reader' },
  loader: async ({ context, params }) => {
    const { urlKey } = await ensureFromSlug(context.queryClient, params.songSlug, songQueryOptions);
    return { urlKey };
  },
  pendingComponent: () => <Skeleton className="mx-auto mt-24 h-[70svh] max-w-3xl" />,
  component: SongPage,
});

function SongPage() {
  const { urlKey } = Route.useLoaderData();
  const { data: song } = useSuspenseQuery(songQueryOptions(urlKey));
  return <SongView key={song._id} song={song} />;
}

// One song in the reader on its own, opened from Songs.
function SongView({ song }: { song: Song }) {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const [mode] = useReaderMode();
  const originalKey = parseKey(song.originalKey);
  const [playKey, setPlayKey] = useState<MusicKey | null>(originalKey);
  const [capo, setCapo] = useSongCapo(song._id, song.capo);
  const auto = useAutoScroll(song._id);
  useKeyShortcuts(mode === 'chords' ? originalKey : null, playKey, setPlayKey);
  const readingTrigger = (
    <Button
      variant="glass"
      size="dock"
      className="text-[0.9375rem]"
      aria-label={t('reader.reading')}
    >
      Aa
    </Button>
  );

  return (
    <ReaderLayout
      back={<ReaderBack to="/songs" label={t('songs.title')} />}
      modes={<ReaderModes />}
      auto={<AutoScrollButton auto={auto} placement="top" className="wide:inline-flex hidden" />}
      compactTitle={song.title}
      actions={
        <>
          <WideReadingControls auto={auto} />
          <ReadingSettings
            present={{
              songs: [toPresentSong(song, playKey, originalKey, capo)],
              startIndex: 0,
              onStart: () => (auto.running ? auto.toggle() : undefined),
              onExit: () => undefined,
            }}
          />
          <AddToSetlist
            song={song}
            session={session}
            trigger={
              <Button variant="glass" size="icon-lg" aria-label={t('addToSetlist.title')}>
                <Plus />
              </Button>
            }
          />
          {canWriteSongs(session) ? (
            <Button asChild variant="glass" size="icon-lg" aria-label={t('songEditor.edit')}>
              <Link
                to="/songs/$songSlug/edit"
                params={{ songSlug: songSlug(song) }}
                title={t('songEditor.edit')}
              >
                <PenSquare />
              </Link>
            </Button>
          ) : null}
        </>
      }
      dock={
        <>
          <ReadingPanel trigger={readingTrigger} auto={auto} />
          <AutoScrollButton auto={auto} placement="dock" />
          <span className="flex-1" />
          {mode === 'chords' && originalKey && playKey ? (
            <KeyPicker
              placement="dock"
              originalKey={originalKey}
              playKey={playKey}
              onChange={setPlayKey}
              capo={capo}
              onCapoChange={setCapo}
            />
          ) : null}
        </>
      }
    >
      <SongReader
        song={song}
        playKey={playKey}
        onPlayKeyChange={setPlayKey}
        capo={capo}
        onCapoChange={setCapo}
      />
    </ReaderLayout>
  );
}
