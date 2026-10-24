import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Close, PenSquare, Play } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { KeyChip } from '@/components/primitives/key-chip';
import { Tag } from '@/components/primitives/tag';
import { TempoMeter, tempoLevel } from '@/components/primitives/tempo-meter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { songQueryOptions, type SongSummary, TEMPO_LABEL_KEYS } from './api';
import { lyricsPeek } from './lyrics-peek';

const TEMPO_KEY_BY_LEVEL = [
  TEMPO_LABEL_KEYS.Slow,
  TEMPO_LABEL_KEYS['Medium Slow'],
  TEMPO_LABEL_KEYS.Medium,
  TEMPO_LABEL_KEYS.Fast,
] as const;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-ink-3 text-xs font-semibold">{label}</dt>
      <dd className="m-0 mt-1 flex h-6 items-center gap-2 text-sm font-semibold">{children}</dd>
    </div>
  );
}

function LyricsPeek({ songId }: { songId: string }) {
  const { data, isPending } = useQuery(songQueryOptions(songId));
  if (isPending) return <Skeleton className="mt-6 h-28 w-full rounded-2xl" />;
  const peek = data ? lyricsPeek(data.chordLyrics) : null;
  if (!peek) return null;
  return (
    <div className="bg-fill-hover mt-6 rounded-2xl p-4">
      {peek.label ? (
        <h3 className="text-ink-3 m-0 mb-2 text-xs font-semibold">{peek.label}</h3>
      ) : null}
      {peek.lines.map((line) => (
        <p key={line.id} className="m-0 mb-2 flex flex-wrap last:mb-0">
          {line.segments.map(({ id, chord, lyric }) => (
            <span key={id} className="inline-flex flex-col">
              <span className="text-chord min-h-[1.2em] pr-1 font-mono text-xs font-bold">
                {chord}
              </span>
              <span className="whitespace-pre">{lyric}</span>
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

// Desktop: the selected song's facts, themes and opening lines beside the table.
export function SongPreview({
  song,
  canEdit,
  onClose,
}: {
  song: SongSummary;
  canEdit: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const level = tempoLevel(song.tempo);
  const tempoKey = TEMPO_KEY_BY_LEVEL[level - 1];
  return (
    <aside
      aria-label={t('songs.preview.label', { title: song.title })}
      className="animate-pane-in border-hairline sticky top-20 border-l pt-4 pl-8"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 -right-2 z-[2]"
        aria-label={t('songs.preview.close')}
        title={t('songs.preview.closeHint')}
        onClick={onClose}
      >
        <Close />
      </Button>
      <h2 className="text-card-title m-0 pr-10 font-bold tracking-[-0.02em]">{song.title}</h2>
      <p className="text-ink-2 mt-1">{song.artist}</p>
      <div className="mt-4 mb-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/songs/$songId" params={{ songId: song._id }}>
            <Play />
            {t('songs.preview.open')}
          </Link>
        </Button>
        {canEdit ? (
          <Button asChild variant="ghost">
            <Link to="/songs/$songId/edit" params={{ songId: song._id }}>
              <PenSquare />
              {t('songs.preview.edit')}
            </Link>
          </Button>
        ) : null}
      </div>
      <dl className="m-0 grid grid-cols-[repeat(4,auto)] justify-start gap-x-6 gap-y-1">
        <Fact label={t('songs.columns.key')}>
          <KeyChip musicKey={song.originalKey} />
        </Fact>
        <Fact label={t('songs.columns.tempo')}>
          <TempoMeter tempo={song.tempo} />
          {tempoKey ? <span>{t(tempoKey)}</span> : null}
        </Fact>
        {song.timeSignature[0] ? (
          <Fact label={t('songs.preview.time')}>
            <span className="font-mono">{song.timeSignature[0]}</span>
          </Fact>
        ) : null}
        {song.code ? (
          <Fact label={t('songs.columns.code')}>
            <span className="font-mono">{song.code}</span>
          </Fact>
        ) : null}
      </dl>
      {song.themes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {song.themes.map((theme) => (
            <Tag key={theme}>{theme}</Tag>
          ))}
        </div>
      ) : null}
      <LyricsPeek key={song._id} songId={song._id} />
    </aside>
  );
}
