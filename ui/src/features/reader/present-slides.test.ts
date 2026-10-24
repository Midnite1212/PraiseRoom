import { describe, expect, it } from 'vitest';

import { parseChordLyrics } from '@/features/chords/parse';

import {
  buildSlides,
  clampSlide,
  firstLyric,
  nextUp,
  type PresentSong,
  titleSlideIndex,
} from './present-slides';

const songs: Pick<PresentSong, 'chordLyrics' | 'title'>[] = [
  { title: 'First Song', chordLyrics: '{Verse 1}\n[G]One two\n[C]Three\n\n{Chorus}\nLa la la' },
  { title: 'Second Song', chordLyrics: 'Just a line' },
  { title: 'Empty Song', chordLyrics: '' },
];

describe('buildSlides', () => {
  it('makes a title slide per song, then one slide per section', () => {
    const slides = buildSlides(songs);

    expect(slides.map((slide) => [slide.kind, slide.songIndex])).toEqual([
      ['title', 0],
      ['section', 0],
      ['section', 0],
      ['title', 1],
      ['section', 1],
      ['title', 2],
    ]);
    const labels = slides.flatMap((slide) =>
      slide.kind === 'section' ? [slide.section.label] : []
    );
    expect(labels).toEqual(['Verse 1', 'Chorus', null]);
  });

  it('gives no slides for no songs', () => {
    expect(buildSlides([])).toEqual([]);
  });
});

describe('titleSlideIndex', () => {
  it('finds the title slide of a song', () => {
    const slides = buildSlides(songs);

    expect(titleSlideIndex(slides, 0)).toBe(0);
    expect(titleSlideIndex(slides, 1)).toBe(3);
    expect(titleSlideIndex(slides, 2)).toBe(5);
  });

  it('falls back to the first slide for an unknown song', () => {
    expect(titleSlideIndex(buildSlides(songs), 9)).toBe(0);
  });
});

describe('clampSlide', () => {
  it('keeps the index inside the slides', () => {
    expect(clampSlide(-1, 6)).toBe(0);
    expect(clampSlide(3, 6)).toBe(3);
    expect(clampSlide(6, 6)).toBe(5);
    expect(clampSlide(1, 0)).toBe(0);
  });
});

describe('firstLyric', () => {
  it('joins the first line with lyrics, without chords', () => {
    const [section] = parseChordLyrics('[G]Hold me [C]close\nSecond');

    expect(section && firstLyric(section)).toBe('Hold me close');
  });

  it('skips lines that have only chords', () => {
    const [section] = parseChordLyrics('[G] [C]\nSung line');

    expect(section && firstLyric(section)).toBe('Sung line');
  });
});

describe('nextUp', () => {
  const slides = buildSlides(songs);

  it('names the next section by its first line', () => {
    expect(nextUp(slides, 0, songs)).toEqual({ kind: 'line', text: 'One two' });
    expect(nextUp(slides, 1, songs)).toEqual({ kind: 'line', text: 'La la la' });
  });

  it('names the next song at a song boundary', () => {
    expect(nextUp(slides, 2, songs)).toEqual({ kind: 'song', title: 'Second Song' });
  });

  it('ends after the last slide', () => {
    expect(nextUp(slides, slides.length - 1, songs)).toEqual({ kind: 'end' });
  });
});
