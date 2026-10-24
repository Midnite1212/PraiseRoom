import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
