import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { LyricsColumns } from './lyrics-columns';
import { LyricsColumnsControl, SongInfo } from './reader-controls';
import type { ReaderSong } from './song';

describe('LyricsColumnsControl', () => {
  it('marks the current column count and reports the one chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(columns: LyricsColumns) => void>();
    render(<LyricsColumnsControl columns="3" onChange={onChange} />);

    expect(screen.getByRole('radio', { name: 'Lyric columns: 3' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Lyric columns: 1' }));

    expect(onChange).toHaveBeenCalledWith('1');
  });
});

describe('SongInfo', () => {
  const song: ReaderSong = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Invented Song',
    artist: 'Invented Artist',
    originalKey: 'E',
    chordLyrics: '[E]Line',
    tempo: [],
    timeSignature: [],
    themes: [],
  };

  it('lists the capo only when the song has one', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SongInfo song={{ ...song, capo: 6 }} />);
    await user.click(screen.getByRole('button', { name: 'Song details' }));
    expect(screen.getByText('Capo')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    rerender(<SongInfo song={{ ...song, capo: null }} />);
    expect(screen.queryByText('Capo')).not.toBeInTheDocument();
  });
});
