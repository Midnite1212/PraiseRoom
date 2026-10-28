import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

describe('SongReader song flow', () => {
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

  it('lists the flow and shows each distinct section once by default', () => {
    renderRepeated();
    const flow = screen.getByRole('navigation', { name: 'Song flow' });
    expect(flow.querySelectorAll('button')).toHaveLength(4);
    expect(screen.getAllByRole('heading', { name: 'Chorus' })).toHaveLength(1);
  });

  it('scrolls a repeated chip to the block that shows it', () => {
    const scrollIntoView = vi.fn<() => void>();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderRepeated();
    const chips = screen.getByRole('navigation', { name: 'Song flow' }).querySelectorAll('button');
    chips[3]?.click();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('song-title-s3'));
  });

  it('shows the full flow and no chips when repeats are shown, or in Lyrics mode', () => {
    const { unmount } = renderRepeated('all');
    expect(screen.queryByRole('navigation', { name: 'Song flow' })).toBeNull();
    expect(screen.getAllByRole('heading', { name: 'Chorus' })).toHaveLength(2);
    unmount();

    localStorage.setItem('reader-mode', 'lyrics');
    renderRepeated();
    expect(screen.queryByRole('navigation', { name: 'Song flow' })).toBeNull();
    expect(screen.getAllByRole('heading', { name: 'Chorus' })).toHaveLength(2);
  });
});
