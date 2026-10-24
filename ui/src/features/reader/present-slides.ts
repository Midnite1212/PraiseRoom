import { type ChordSection, parseChordLyrics } from '@/features/chords/parse';
import type { MusicKey } from '@/features/chords/theory';

import type { ReaderSong } from './song';

export type PresentSong = {
  id: string;
  title: string;
  artist: string;
  chordLyrics: string;
  originalKey: MusicKey | null;
  playKey: MusicKey | null;
  capo: number;
};

export type Slide =
  | { kind: 'title'; songIndex: number }
  | { kind: 'section'; songIndex: number; section: ChordSection };

export type NextUp =
  | { kind: 'line'; text: string }
  | { kind: 'song'; title: string }
  | { kind: 'end' };

export const toPresentSong = (
  song: ReaderSong,
  playKey: MusicKey | null,
  originalKey: MusicKey | null,
  capo: number
): PresentSong => ({
  id: song._id,
  title: song.title,
  artist: song.artist,
  chordLyrics: song.chordLyrics,
  originalKey,
  playKey,
  capo,
});

// A title slide per song, then one slide per section, in set order.
export const buildSlides = (songs: readonly Pick<PresentSong, 'chordLyrics'>[]): Slide[] =>
  songs.flatMap(({ chordLyrics }, songIndex): Slide[] => [
    { kind: 'title', songIndex },
    ...parseChordLyrics(chordLyrics).map((section): Slide => ({
      kind: 'section',
      songIndex,
      section,
    })),
  ]);

export const clampSlide = (index: number, count: number): number =>
  Math.min(Math.max(index, 0), Math.max(count - 1, 0));

export const titleSlideIndex = (slides: readonly Slide[], songIndex: number): number =>
  Math.max(
    0,
    slides.findIndex((slide) => slide.kind === 'title' && slide.songIndex === songIndex)
  );

export const firstLyric = (section: ChordSection): string => {
  for (const { segments } of section.lines) {
    const text = segments
      .map(({ lyric }) => lyric)
      .join('')
      .trim();
    if (text !== '') return text;
  }
  return '';
};

export const nextUp = (
  slides: readonly Slide[],
  index: number,
  songs: readonly Pick<PresentSong, 'title'>[]
): NextUp => {
  const next = slides[index + 1];
  if (!next) return { kind: 'end' };
  if (next.kind === 'title') return { kind: 'song', title: songs[next.songIndex]?.title ?? '' };
  return { kind: 'line', text: firstLyric(next.section) || (next.section.label ?? '') };
};
