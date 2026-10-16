import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { type MusicKey, parseKey } from '@/features/chords/theory';
import { ReaderPreferenceControls, SongReader } from '@/features/reader/song-reader';
import { type Song, songQueryOptions } from '@/features/songs/api';
import { ensureOrNotFound } from '@/lib/ensure-or-not-found';

export const Route = createFileRoute('/_app/songs/$songId')({
  loader: ({ context, params }) =>
    ensureOrNotFound(context.queryClient, songQueryOptions(params.songId)),
  pendingComponent: () => <Skeleton className="mx-auto h-[70svh] max-w-4xl" />,
  component: SongPage,
});

function SongPage() {
  const { songId } = Route.useParams();
  const { data: song } = useSuspenseQuery(songQueryOptions(songId));
  return <SongView key={song._id} song={song} />;
}

function SongView({ song }: { song: Song }) {
  const { t } = useTranslation();
  const [playKey, setPlayKey] = useState<MusicKey | null>(() => parseKey(song.originalKey));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/songs">
            <ChevronLeft />
            {t('songs.title')}
          </Link>
        </Button>
        <div className="flex items-center gap-1.5">
          <ReaderPreferenceControls />
        </div>
      </div>
      <SongReader song={song} playKey={playKey} onPlayKeyChange={setPlayKey} />
    </div>
  );
}
