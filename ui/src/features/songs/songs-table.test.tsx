import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/test/render-with-router';

import type { SongSort, SongSummary } from './api';
import { SongsTable } from './songs-table';

const song = (id: string, title: string): SongSummary => ({
  _id: id,
  urlKey: 'k3x9p2',
  title,
  artist: 'Test Artist',
  originalKey: 'G',
  tempo: ['Slow', 'Medium'],
  timeSignature: ['4/4'],
  themes: ['Grace'],
  code: null,
});

const sorted = { sort: 'title', dir: 'asc', onSort: vi.fn<(sort: SongSort) => void>() } as const;

const songs = [song('a'.repeat(24), 'Song One'), song('b'.repeat(24), 'Song Two')];

describe('SongsTable', () => {
  it('renders Title, Key, Tempo and Code columns with the artist under each title', async () => {
    renderWithRouter(
      <SongsTable songs={songs} onSelect={vi.fn<(songId: string) => void>()} {...sorted} />
    );

    await screen.findByRole('columnheader', { name: 'Title' });
    for (const name of ['Key', 'Tempo', 'Code'])
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Artist' })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Song One/ })).toHaveTextContent('Test Artist');
    expect(screen.getAllByLabelText('Key G')).toHaveLength(2);
  });

  it('marks the selected row and selects a row on click', async () => {
    const onSelect = vi.fn<(songId: string) => void>();
    renderWithRouter(
      <SongsTable songs={songs} selectedId={songs[1]?._id} onSelect={onSelect} {...sorted} />
    );

    const one = await screen.findByRole('row', { name: /Song One/ });
    expect(screen.getByRole('row', { name: /Song Two/ })).toHaveAttribute('aria-selected', 'true');
    expect(one).toHaveAttribute('aria-selected', 'false');

    await userEvent.click(one);
    expect(onSelect).toHaveBeenCalledWith(songs[0]?._id);
  });

  it('moves the selection with the arrow keys', async () => {
    const onSelect = vi.fn<(songId: string) => void>();
    renderWithRouter(
      <SongsTable songs={songs} selectedId={songs[0]?._id} onSelect={onSelect} {...sorted} />
    );

    (await screen.findByRole('row', { name: /Song One/ })).focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(onSelect).toHaveBeenCalledWith(songs[1]?._id);
    expect(screen.getByRole('row', { name: /Song Two/ })).toHaveFocus();
  });

  it('sorts by a clicked header and marks the current sort and direction', async () => {
    const onSort = vi.fn<(sort: SongSort) => void>();
    renderWithRouter(
      <SongsTable
        songs={songs}
        sort="key"
        dir="desc"
        onSort={onSort}
        onSelect={vi.fn<(songId: string) => void>()}
      />
    );

    expect(await screen.findByRole('columnheader', { name: 'Key' })).toHaveAttribute(
      'aria-sort',
      'descending'
    );
    expect(screen.getByRole('columnheader', { name: 'Tempo' })).not.toHaveAttribute('aria-sort');

    await userEvent.click(screen.getByRole('button', { name: 'Tempo' }));
    expect(onSort).toHaveBeenCalledWith('tempo');
  });

  it('shows the empty state when there are no songs', async () => {
    renderWithRouter(
      <SongsTable songs={[]} onSelect={vi.fn<(songId: string) => void>()} {...sorted} />
    );

    expect(await screen.findByText('No songs found.')).toBeInTheDocument();
  });
});
