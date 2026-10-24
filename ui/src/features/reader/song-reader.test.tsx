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
