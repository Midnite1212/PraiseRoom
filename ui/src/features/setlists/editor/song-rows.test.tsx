import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { DraftSong } from './setlist-draft';
import { SongRows } from './song-rows';

const song = (id: string, originalKey: string, key: string, tempo = 'Medium'): DraftSong => ({
  _id: id,
  title: `Song ${id}`,
  artist: 'Artist',
  originalKey,
  tempo: [tempo],
  key,
});

const SONGS = [song('a', 'G', 'G'), song('b', 'D', 'E'), song('c', 'C', 'A')];

const renderRows = () => {
  const onReorder = vi.fn<(songs: DraftSong[]) => void>();
  const onStepKey = vi.fn<(songId: string, step: 1 | -1) => void>();
  const onRemove = vi.fn<(song: DraftSong) => void>();
  render(
    <SongRows songs={SONGS} onReorder={onReorder} onStepKey={onStepKey} onRemove={onRemove} />
  );
  return { onReorder, onStepKey, onRemove };
};

const rowOf = (title: string) => {
  const row = screen.getByText(title).closest('li');
  if (!row) throw new Error(`No row for ${title}`);
  return within(row);
};

describe('SongRows', () => {
  it('numbers the songs and shows how far each key sits from the original', () => {
    renderRows();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(rowOf('Song a').queryByText(/^[+\u2212]\d$/)).not.toBeInTheDocument();
    expect(rowOf('Song b').getByText('+2')).toBeInTheDocument();
    expect(rowOf('Song c').getByText('\u22123')).toBeInTheDocument();
  });

  it('marks the key change from the song before and none on the first song', () => {
    renderRows();
    expect(rowOf('Song a').queryByText(/semitone/)).not.toBeInTheDocument();
    expect(rowOf('Song b').getByText('Down 3 semitones from the song before')).toBeInTheDocument();
    expect(rowOf('Song c').getByText('Up 5 semitones from the song before')).toBeInTheDocument();
  });

  it('steps a key by one semitone and removes a song', async () => {
    const user = userEvent.setup();
    const { onStepKey, onRemove } = renderRows();
    const group = screen.getByRole('group', { name: 'Key for Song b' });
    await user.click(within(group).getByRole('button', { name: 'Key up a semitone' }));
    await user.click(within(group).getByRole('button', { name: 'Key down a semitone' }));
    expect(onStepKey.mock.calls).toEqual([
      ['b', 1],
      ['b', -1],
    ]);

    await user.click(screen.getByRole('button', { name: 'Remove Song c' }));
    expect(onRemove).toHaveBeenCalledWith(SONGS[2]);
  });

  it('moves a song with the arrow keys on its handle', async () => {
    const user = userEvent.setup();
    const { onReorder } = renderRows();
    screen.getByRole('button', { name: /^Move Song a/ }).focus();
    await user.keyboard('{ArrowDown}');
    expect(onReorder.mock.calls[0]?.[0].map(({ _id }) => _id)).toEqual(['b', 'a', 'c']);
  });
});
