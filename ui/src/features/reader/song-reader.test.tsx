import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { parseKey } from '@/features/chords/theory';

import type { ReaderSong } from './song';
import { SongReader } from './song-reader';

const SONG: ReaderSong = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Invented Song',
  artist: 'Invented Artist',
  originalKey: 'E',
  chordLyrics: '[E]Line',
  tempo: [],
  timeSignature: [],
  themes: [],
};

const renderReader = (note?: string) =>
  render(<SongReader song={SONG} playKey={parseKey('E')} onPlayKeyChange={() => {}} note={note} />);

afterEach(() => localStorage.clear());

describe('SongReader note', () => {
  it('shows the setlist note under the artist in Chords mode', () => {
    renderReader('Acapella last chorus');
    expect(screen.getByText('Acapella last chorus')).toBeInTheDocument();
  });

  it('hides the note in Lyrics mode', () => {
    localStorage.setItem('reader-mode', 'lyrics');
    renderReader('Acapella last chorus');
    expect(screen.queryByText('Acapella last chorus')).not.toBeInTheDocument();
  });

  it('renders nothing extra for a song without a note', () => {
    const { container } = renderReader();
    expect(container.querySelector('header p')).toBeNull();
  });
});

describe('SongReader section repeats', () => {
  const REPEATED: ReaderSong = {
    ...SONG,
    chordLyrics: '{Verse 1}\n[E]One\n{Chorus}\n[A]Two\n{Verse 2}\n[E]Three\n{Chorus}\n[A]Two',
  };
  const renderRepeated = (repeats?: 'once' | 'all') =>
    render(
      <SongReader
        song={REPEATED}
        playKey={parseKey('E')}
        onPlayKeyChange={() => {}}
        repeats={repeats}
      />
    );

  it('shows each distinct section once by default, with no section chips', () => {
    renderRepeated();
    expect(screen.getAllByRole('heading', { name: 'Chorus' })).toHaveLength(1);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('shows the full flow when repeats are shown', () => {
    renderRepeated('all');
    expect(screen.getAllByRole('heading', { name: 'Chorus' })).toHaveLength(2);
  });

  it('folds repeats in Lyrics mode too', () => {
    localStorage.setItem('reader-mode', 'lyrics');
    renderRepeated();
    expect(screen.getAllByRole('heading', { name: 'Chorus' })).toHaveLength(1);
  });
});
