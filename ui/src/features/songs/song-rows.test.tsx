import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/test/render-with-router';

import type { SongSummary } from './api';
import { SongRows } from './song-rows';

const song = (id: string, title: string): SongSummary => ({
  _id: id,
  urlKey: 'k3x9p2',
  title,
  artist: 'Test Artist',
  originalKey: 'G',
  tempo: ['Slow'],
  timeSignature: ['4/4'],
  themes: [],
  code: 'A1',
});

const songs = [song('0123456789abcdef01234567', 'Alpha'), song('0123456789abcdef01234568', 'Beta')];

describe('SongRows', () => {
  it('offers the empty action alongside the existing clear actions', async () => {
    const onSearchWeb = vi.fn<() => void>();
    const onClearSearch = vi.fn<() => void>();
    const onClearFilters = vi.fn<() => void>();
    renderWithRouter(
      <SongRows
        songs={[]}
        sort="title"
        nextSetSongIds={new Set()}
        emptyAction={<button onClick={onSearchWeb}>Search the web</button>}
        onClearSearch={onClearSearch}
        onClearFilters={onClearFilters}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Search the web' }));
    expect(onSearchWeb).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClearSearch).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it('hides the empty action when songs are present', async () => {
    renderWithRouter(
      <SongRows
        songs={songs}
        sort="title"
        nextSetSongIds={new Set()}
        emptyAction={<button>Search the web</button>}
      />
    );

    await screen.findByRole('link', { name: /Alpha/ });
    expect(screen.queryByRole('button', { name: 'Search the web' })).not.toBeInTheDocument();
  });

  it('shows the Next set marker only on songs in the next set', async () => {
    renderWithRouter(
      <SongRows songs={songs} sort="title" nextSetSongIds={new Set(['0123456789abcdef01234568'])} />
    );
    expect(await screen.findAllByText('Next set')).toHaveLength(1);
  });

  it('groups by letter with a scrubber when grouped', async () => {
    renderWithRouter(<SongRows songs={songs} sort="title" grouped nextSetSongIds={new Set()} />);
    expect(await screen.findByRole('heading', { name: /^A/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Songs starting with B' })).toBeInTheDocument();
  });

  it('has no headings or scrubber when not grouped', async () => {
    renderWithRouter(<SongRows songs={songs} sort="title" nextSetSongIds={new Set()} />);
    expect(await screen.findByRole('link', { name: /Alpha/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
