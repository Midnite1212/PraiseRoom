import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseKey } from '@/features/chords/theory';

import type { PresentSong } from './present-slides';
import { Presentation } from './presentation';

const keyOfG = parseKey('G');

const songs: PresentSong[] = [
  {
    id: 'a',
    title: 'First Song',
    artist: 'Test Artist',
    chordLyrics: '{Verse 1}\n[G]Line one\nLine two\n\n{Chorus}\nChorus line',
    originalKey: keyOfG,
    playKey: keyOfG,
    capo: 0,
  },
  {
    id: 'b',
    title: 'Second Song',
    artist: 'Other Artist',
    chordLyrics: '{Verse 1}\nSecond verse',
    originalKey: keyOfG,
    playKey: keyOfG,
    capo: 0,
  },
];

const renderPresentation = (startIndex = 0) => {
  const onExit = vi.fn<(songIndex: number) => void>();
  render(<Presentation songs={songs} startIndex={startIndex} onExit={onExit} />);
  return { onExit, user: userEvent.setup() };
};

describe('Presentation', () => {
  afterEach(() => localStorage.clear());

  it('opens on the title slide of the song it was started from', () => {
    renderPresentation(1);

    expect(screen.getByRole('heading', { name: 'Second Song' })).toBeInTheDocument();
    expect(screen.getByText('Song 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('Next line: Second verse')).toBeInTheDocument();
  });

  it('steps through the sections with the arrow keys and space', async () => {
    const { user } = renderPresentation();

    expect(screen.getByText('Next line: Line one')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Verse 1', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('1/2 · Verse 1')).toBeInTheDocument();
    expect(screen.getByText('Next line: Chorus line')).toBeInTheDocument();
    await user.keyboard(' ');
    expect(screen.getByText('Chorus line')).toBeInTheDocument();
    expect(screen.getByText('Next song: Second Song')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('1/2 · Verse 1')).toBeInTheDocument();
  });

  it('stops at both ends and says when the set is over', async () => {
    const { user } = renderPresentation(1);

    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('heading', { name: 'First Song' })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}'.repeat(10));
    expect(screen.getByText('Second verse')).toBeInTheDocument();
    expect(screen.getByText('End of the set')).toBeInTheDocument();
  });

  it('shows chords only when asked', async () => {
    const { user } = renderPresentation();
    await user.keyboard('{ArrowRight}');

    expect(screen.queryByText('G')).not.toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Show chords' }));
    expect(screen.getByText('G')).toBeInTheDocument();
    await user.keyboard('c');
    expect(screen.queryByText('G')).not.toBeInTheDocument();
  });

  it('exits with the song it stopped on', async () => {
    const { onExit, user } = renderPresentation();

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{Escape}');
    expect(onExit).toHaveBeenCalledWith(1);
  });

  it('exits from the Exit button', async () => {
    const { onExit, user } = renderPresentation();

    await user.click(screen.getByRole('button', { name: 'Exit' }));
    expect(onExit).toHaveBeenCalledWith(0);
  });

  it('keeps its keys from reaching the reader behind it', async () => {
    const behind = vi.fn<(event: KeyboardEvent) => void>();
    window.addEventListener('keydown', behind);
    const { user } = renderPresentation();

    await user.keyboard('{ArrowRight}');
    expect(behind).not.toHaveBeenCalled();
    window.removeEventListener('keydown', behind);
  });
});
